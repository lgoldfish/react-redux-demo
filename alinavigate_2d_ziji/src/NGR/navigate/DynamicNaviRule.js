const elevator = [24091000, 24092000];
const escalator = [24093000, 24094000, 24095000, 24096000];

class DynamicNaviRule {
    static getFacilityType(category) {
        let type = '';
        if(elevator.indexOf(category) !== -1) {
            type = '电梯';
        } else if(escalator.indexOf(category) !== -1) {
            type = '扶梯';
        }
        return type;
    }

    static getDirection(angle) {
        let direction;
        if(angle >= 180) {
            angle -= 360;
        } else if(angle <= - 180) {
            angle += 360;
        }

        if(-180 <= angle && angle <= -100) {
            direction = 'leftrear';
        } else if(-100 < angle && angle <= -80) {
            direction = 'left';
        } else if(-80 < angle && angle <=0) {
            direction = 'leftfront';
        } else if (0 < angle && angle <= 80) {
            direction = 'rightfront';
        } else if(80 < angle && angle <= 100) {
            direction = 'right';
        } else if(100 < angle && angle <= 180) {
            direction = 'rightrear';
        } 

        return direction;

    }
}

export default DynamicNaviRule;
