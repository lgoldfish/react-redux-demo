import{ INCREMENT } from "../reducers/reducer"
export const increment = () =>{
    return dispatch =>{
        dispatch({
            type:INCREMENT
        })
    }
}