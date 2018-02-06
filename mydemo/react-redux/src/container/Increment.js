import React from "react"
import Index from "../components/Index"
import {connect} from "react-redux"
import {increment} from "../actions/action"
const Increment = props =>(
    <div>
        {console.log("props is",props)}
        <Index onClick={props.increment}/>
    </div>
)
const mapStateToProps = (state) => {
    return {
        count: state.count
    };
}
const mapDispatchToProps = (dispatch, ownProps) => {
    console.log("ownProps",ownProps)
    return {
        increment: () => dispatch({ type: 'counter/INCREMENT' })
    };
}
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Increment)