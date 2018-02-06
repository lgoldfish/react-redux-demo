export const INCREMENT ="counter/INCREMENT"

const initialState = {
    count:0
}
export default (state = initialState, action) => {
    switch(action.type) {
        case INCREMENT:
            console.log('1231');
            return {
                ...state,
                count: state.count + 1
            }
        default: 
            return state;
    }
}