import {ModelJSON} from "./canonical";
import {LegacyModelJSON} from "./legacy";

export const schema = ModelJSON.or(LegacyModelJSON).array();
