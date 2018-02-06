import React , {Component} from "react";

class Index extends Component {
    render() {
      return (
        <div>  
            {console.log("this.props is",this.props)}
          <button onClick={this.props.onClick}>加</button>
        </div>
      );
    }
  }
  
  export default Index;
  