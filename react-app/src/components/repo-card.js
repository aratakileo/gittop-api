import { formatedNumericValue, } from "../utils/utils";

export const RepoCard = ({repo}) => {
    const repoPath = repo.owner.username + '/' + repo.name;

    return (
    <div className='repo-card bg-hover-animation' onClick={() => window.location.href = repo.url}>
        <div className='header'>
            <b>
                <p className='name'>{repoPath}</p>
            </b>
            <div className="stars">{formatedNumericValue(repo.stars)}</div>
        </div>
        <p>{repo.description}</p>
    </div>)
};