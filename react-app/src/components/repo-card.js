import { formatedNumericValue, } from "../utils/utils";
import { InteractableText } from "./interactable-text";

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
        <InteractableText text={repo.description}/>
    </div>)
};