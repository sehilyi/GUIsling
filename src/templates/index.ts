import { OverlaidTracks, SingleTrack } from "gosling.js/dist/src/core/gosling.schema";
import example from './images/example.jpeg';

type Template = {
    name: string;
    spec: Partial<OverlaidTracks> | Partial<SingleTrack>;
    thumbnail: string;
}
const Templates: Template[] = [
    {
        name: 'Bar Chart',
        spec: {},
        thumbnail: example
    }
]

export default Templates;