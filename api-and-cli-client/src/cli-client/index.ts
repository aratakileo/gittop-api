import {getRequestOptions, RequestMethod} from "./constants";
import {fetchApi, getValueOrDefault, Result} from "../utils";
import { parseFlags, ValueType } from "../parseUtil";


const describeRepo = (data: any) => {
    let output = `=======${data.name} (id: ${data.id})=======`
        + `\nby: @${data.owner.username}\nstars: ${data.stars}`;

    if (data.lang !== null)
        output += `\nlang: ${data.lang}`;

    output += `\nlink: ${data.url}\nabout: ${data.description}`;

    return output;
};

const stringifyQueryParams = (params: any) => {
    if (params === null)
        return '';

    let result = '?';

    if ('langs' in params && params.langs.length !== 0)
        result += `langs=${encodeURIComponent(JSON.stringify(params.langs))}&`;

    return result + `order=${params.order}`;
};


class CliClient {
    private argIndex = 0;
    private readonly args: string[];

    public constructor() {
        this.args = process.argv.slice(2);
    }

    public exec() {
        switch (this.arg) {
            case 'syncnow':
                this.makeApiRequest('/v1/syncnow', data => console.log(data.body.message), null, RequestMethod.POST);
                return;
            case 'get':
                this.handleGet();
                return;
            default:
                this.handleInvalidCommand();
                return;
        }
    }

    private parseFilters() {
        const flagsResult = parseFlags(this.args.slice(this.argIndex + 1), {
            'langs': ValueType.ANY,
            'order': ValueType.ANY
        });

        if (!flagsResult.is_ok)
            return flagsResult;

        const langs = flagsResult.val !== null && 'langs' in flagsResult.val ? flagsResult.val.langs.split(',') : [];
        const order = getValueOrDefault(flagsResult.val, 'order', 'DESC');

        if (!['ASC', 'DESC'].includes(order.toUpperCase()))
            return Result.err(`expected 'ASC' or 'DESC', but got '${order}' for filter 'order'`);

        return Result.ok({langs, order});
    }

    private async handleGet() {
        switch (this.next()) {
            case 'repo':
                this.handleGetRepo();
                return;
            case 'repos':
                await this.handleGetRepos();
                return;
            case 'stats':
                await this.handleGetStats();
                return;
            default:
                this.handleInvalidCommand();
                return;
        }
    }

    private async handleGetStats() {
        await this.makeApiRequest('/v2/repos/pages', data => {
            console.log(`${data.body.total} repositories on ${data.body.pages} pages`);

            for (const [lang, count] of Object.entries(data.body.langs))
                console.log(` - ${lang}: ${count}`);
        });

        await this.makeApiRequest('/v2/repos/page/0', data => {
            const mostPopularRepo = data.body.repos[0];
            console.log(`The most popular repo ${mostPopularRepo.name}/${mostPopularRepo.owner.username} with ${mostPopularRepo.stars} stars`);
        })

        await this.makeApiRequest('/v2/repos/page/0', data => {
            const leastPopularRepo = data.body.repos[0];
            console.log(`The least popular repo ${leastPopularRepo.name}/${leastPopularRepo.owner.username} with ${leastPopularRepo.stars} stars`);
        }, {order: 'ASC'})
    }

    private async handleGetRepos() {
        if (this.next() === undefined) {
            console.error('expected page number');
            return;
        }

        if (isNaN(Number(this.arg))) {
            console.error(`'${this.arg}' is not a number`);
            return;
        }

        // @ts-ignore
        const pageNum = parseInt(this.arg);
        let pages = -1;

        const reposFilterResult = this.parseFilters();

        if (!reposFilterResult.is_ok) {
            console.error(reposFilterResult.err);
            return;
        }

        let langs: any = {};

        await this.makeApiRequest('/v2/repos/pages', data => {
            pages = data.body.pages;
            langs = data.body.langs;
        }, reposFilterResult.val);

        if (pageNum >= pages) {
            console.error(`page ${pageNum} out of bounds of ${pages} pages`);
            return;
        }

        console.log(`For languages: ${Object.keys(langs).join(', ')}`);
        console.log(`${reposFilterResult.val?.order.toLowerCase() === 'asc' ? 'Ascending' : 'Descending'} order\n`);

        this.makeApiRequest('/v2/repos/page/' + pageNum, data => {
            // @ts-ignore
            for (let repoData of data.body.repos)
                console.log(describeRepo(repoData));

            console.log(`page ${pageNum + 1} of ${data.body.pages}`);
        }, reposFilterResult.val);
    }

    private handleGetRepo() {
        if (this.next() === undefined) {
            console.error('expected repository name or id');
            return;
        }

        this.makeApiRequest('/v1/repo/' + this.arg, data => {
            if (data.status !== 200) {
                console.error(`${data.body.error}: ${data.body.description}`);
                return;
            }

            console.log(describeRepo(data.body));
        });
    }

    private handleInvalidCommand() {
        console.error('Invalid command');
    }

    private makeApiRequest = (
        endpoint: string,
        then: ((value: any) => void) | null = null,
        queryParams: any = null,
        method = RequestMethod.GET
    ) => fetchApi(
        getRequestOptions(endpoint + stringifyQueryParams(queryParams), method),
        false
    ).then(data => {
        if (data.status === 500 || data.status === undefined)
            console.error('API returned invalid response:', data);
        else if (then !== null) then(data);
    }).catch(console.error);

    private next() {
        this.argIndex++;
        return this.arg;
    }

    private get arg(): string | undefined {
        return this.args[this.argIndex];
    }
}

new CliClient().exec();
