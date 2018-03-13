import NGRMap from './NGRMap';
import Navigate from './navigate/Navigate';
import Location from './location/Location';
import CompassControl from './control/CompassControl';
import FloorControl from './control/FloorControl';
import LocateControl from './control/LocateControl';
import ScaleControl from './control/ScaleControl';
import ViewControl from './control/ViewControl';
import ZoomControl from './control/ZoomControl';
import Highlight from "./highlight/Highlight";

import * as tool from './utils/tool';

window.NGR = {
    Map: NGRMap,
    Navigate,
    Location,
    CompassControl,
    FloorControl,
    LocateControl,
    ScaleControl,
    ViewControl,
    ZoomControl,
    tool,
    Highlight
};