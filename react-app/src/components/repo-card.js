import { formatedNumericValue, } from "../utils/utils";
import { InteractableText } from "./interactable-text";

export const RepoCard = ({repo}) => {
    const repoName = `${repo.owner.username}/${repo.name}`;

    return (
    <div className='repo-card bg-hover-animation' onClick={() => window.location.href = repo.url}>
        <div className='name-container center vertical'>
            <b><p className='name'>{repoName}</p></b>
            <p className='stars'>{formatedNumericValue(repo.stars)}</p>
            {repo.lang ? <p className='lang-name'>{repo.lang}</p> : ''}
        </div>
        <InteractableText text={repo.description}/>
    </div>)
};