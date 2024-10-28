import {getRequestOptions, RequestMethod} from "./constants";
import {fetchApi} from "../utils";


const describeRepo = (data: any) => {
    let output = `=======${data.name} (id: ${data.id})=======`
        + `\nby: @${data.owner.username}\nstars: ${data.stars}`;

    if (data.lang !== null)
        output += `\nlang: ${data.lang}`;

    output += `\nlink: ${data.url}\nabout: ${data.description}`;

    return output;
}


class CliClient {
    private argIndex = 0;
    private readonly args: string[];

    public constructor() {
        this.args = process.argv.slice(2);
    }

    public exec() {
        switch (this.arg) {
            case 'syncnow':
                this.makeApiRequest('/v1/syncnow', data => console.log(data.body.message));
                return;
            case 'get':
                this.handleGet();
                return;
            default:
                this.handleInvalidCommand();
                return;
        }
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

                await this.makeApiRequest('/v2/repos/pages', data => pages = data.body.pages);

                if (pageNum >= pages) {
                    console.error(`page ${pageNum} out of bounds of ${pages} pages`);
                    return;
                }

                this.makeApiRequest('/v2/repos/page/' + pageNum, data => {
                    // @ts-ignore
                    data.body.repos.forEach(repoData => console.log(describeRepo(repoData)));
                });
                return;
        }
    }

    private handleInvalidCommand() {
        console.error('Invalid command');
    }

    private makeApiRequest = (
        endpoint: string,
        then: ((value: any) => void) | null = null,
        method = RequestMethod.GET
    ) => fetchApi(
        getRequestOptions(endpoint, method),
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
