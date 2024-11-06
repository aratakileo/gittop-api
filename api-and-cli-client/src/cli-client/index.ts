import {getRequestOptions, RequestMethod} from "./constants";
import {fetchApi, Result} from "../utils";


const describeRepo = (data: any) => {
    let output = `=======${data.name} (id: ${data.id})=======`
        + `\nby: @${data.owner.username}\nstars: ${data.stars}`;

    if (data.lang !== null)
        output += `\nlang: ${data.lang}`;

    output += `\nlink: ${data.url}\nabout: ${data.description}`;

    return output;
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
        if (!this.next())
            return Result.ok({langs: []});

        if (!this.arg?.startsWith('langs='))
            return Result.err(`invalid filter argument '${this.arg}'`);

        const filterValue = this.arg.slice('langs='.length);

        if (filterValue.length === 0)
            return Result.err(`'langs' filter argument value is empty`);

        return Result.ok({langs: filterValue.split(',')});
    }

    private async handleGet() {
        switch (this.next()) {
            case undefined:
                this.handleInvalidCommand();
                return;
            case 'repo':
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

                return;
            case 'repos':
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

                let langs: string[] = [];

                await this.makeApiRequest('/v2/repos/pages', data => {
                    pages = data.body.pages;
                    langs = data.body.langs;
                }, reposFilterResult.val);

                if (pageNum >= pages) {
                    console.error(`page ${pageNum} out of bounds of ${pages} pages`);
                    return;
                }

                if (langs) console.log(`Only for languages: ${langs.join(', ')}\n`);

                this.makeApiRequest('/v2/repos/page/' + pageNum, data => {
                    // @ts-ignore
                    for (let repoData of data.body.repos)
                        console.log(describeRepo(repoData));

                    console.log(`page ${pageNum + 1} of ${data.body.pages}`);
                }, reposFilterResult.val);
                return;
        }
    }

    private handleInvalidCommand() {
        console.error('Invalid command');
    }

    private makeApiRequest = (
        endpoint: string,
        then: ((value: any) => void) | null = null,
        queryParams: any = null,
        method = RequestMethod.GET
    ) => {
        const query = queryParams === null && 'langs' in queryParams ? '' : `?langs=${JSON.stringify(queryParams.langs)}`;

        return fetchApi(
            getRequestOptions(endpoint + query, method),
            false
        ).then(data => {
            if (data.status === 500 || data.status === undefined)
                console.error('API returned invalid response:', data);
            else if (then !== null) then(data);
        }).catch(console.error);
    };

    private next() {
        this.argIndex++;
        return this.arg;
    }

    private get arg(): string | undefined {
        return this.args[this.argIndex];
    }
}

new CliClient().exec();
