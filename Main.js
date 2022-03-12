const API = require('./API');

//	Declare variables
let grid = [...new Array(API.mazeHeight()).keys()].map(y => [...new Array(API.mazeHeight()).keys()].map(x => `?`));
let crossroads = {};
let coords = [ 0, API.mazeHeight() - 1 ];
let dir = 0;
let prevCrossroads = [];

function log(text) {
	console.error(text);
}

function moveForward(n = 1) {

	//	Move forward
	API.moveForward();

	//	Select direction
	switch (dir) {

		//	If facing north
		case 0: 
			coords[1] -= n;
			break;

		//	If facing east
		case 3: 
			coords[0] += n
			break;

		//	If facing south
		case 2: 
			coords[1] += n
			break;

		//	If facing west
		case 1: 
			coords[0] -= n
			break;

	}

}

function faceDir(d) {

	//	Calculate offset
	let offset = Math.abs(dir - d);
	let left = dir - d < 0 ? true : false;

	//	Turn offset many times
	for (let i = 0; i < offset; i++) {

		//	Turn
		if (left) API.turnLeft();
		else API.turnRight();

	}

	//	Update dir
	dir = d;

}

function getPossiblePaths(newCoords) {

	//	Keep count of possible paths
	let paths = [];

	//	Get current cell
	let cell = grid[coords[1]][coords[0]];

	//	Check north
	if (cell[0] == '0' && grid[newCoords[1] - 1]) {
		const n = grid[newCoords[1] - 1][newCoords[0]];
		if (n == '?') paths.push(0);
	}

	//	Check east
	if (cell[1] == '0') {
		const e = grid[newCoords[1]][newCoords[0] + 1];
		if (e == '?') paths.push(3);
	}

	//	Check south
	if (cell[2] == '0' && grid[newCoords[1] + 1]) {
		const s = grid[newCoords[1] + 1][newCoords[0]];
		if (s == '?') paths.push(2);
	}

	//	Check west
	if (cell[3] == '0') {
		const w = grid[newCoords[1]][newCoords[0] - 1];
		if (w == '?') paths.push(1);
	}

	//	Return paths
	return paths;

}

function main() {
	log('Running...');
	API.setColor(0, 0, 'G');
	API.setText(0, 0, 'START');

	//	Main simulator loop
	let test = 0;
	while (test < 400) {

		//	Get current cell
		let cell = grid[coords[1]][coords[0]];

		//	If this cell is undiscovered
		if (cell === '?') {

			//	Check for walls
			let walls = [ API.wallFront() ? 1 : 0, API.wallRight() ? 1 : 0, 0, API.wallLeft() ? 1 : 0 ];
			walls = [ ...walls.slice(dir), ...walls.slice(0, dir) ];

			//	Add to grid
			grid[coords[1]][coords[0]] = walls.join('');
			cell = grid[coords[1]][coords[0]];
			API.setColor(coords[0], API.mazeHeight() - coords[1] - 1, 'G');
			API.setText(coords[0], API.mazeHeight() - coords[1] - 1, cell);

		}

		//	Get possible paths
		const paths = getPossiblePaths(coords);

		//	If there are no more possible paths
		if (paths.length === 0) {

			//	Get last crossroad
			const actions = crossroads[prevCrossroads[prevCrossroads.length - 1]] || [];

			//	Loop through each action and do the opposite
			for (let i = actions.length - 1; i >= 0; i--) {

				//	Select direction
				switch (actions[i]) {

					//	If north
					case 0:
						faceDir(2);
						moveForward();
						break;

					//	If east
					case 3:
						faceDir(1);
						moveForward();
						break;

					//	If south
					case 2:
						faceDir(0);
						moveForward();
						break;

					//	If west
					case 1:
						faceDir(3);
						moveForward();
						break;

				}

			}

			//	Delete crossroad
			delete crossroads[prevCrossroads[prevCrossroads.length - 1]];
			prevCrossroads.splice(prevCrossroads.length - 1, 1);

		}
		else if (paths.length > 1) {

			//	Pick random path
			const chosen = paths[Math.floor(Math.random() * paths.length)];

			//	Add this to list of crossroads
			const keys = Object.keys(crossroads);
			const list = crossroads[coords.join(' ')] || [];
			list.push(chosen)
			crossroads[coords.join(' ')] = list;
			API.setColor(coords[0], API.mazeHeight() - coords[1] - 1, 'R');
			prevCrossroads.push(coords.join(' '));

			//	Rotate and move
			faceDir(chosen);
			moveForward();

		}
		else {

			//	Choose path
			const chosen = paths[0];

			//	Remove from list of crossroads
			delete crossroads[coords.join(' ')];

			//	Add path to latest crossroad
			const list = crossroads[prevCrossroads[prevCrossroads.length - 1]] || [];
			list.push(chosen)
			if (prevCrossroads.length) crossroads[prevCrossroads[prevCrossroads.length - 1]] = list;
			else {
				crossroads[coords.join(' ')] = list;
				prevCrossroads.push(coords.join(' '));
			}

			//	Rotate and move
			faceDir(chosen);
			moveForward();

		}

		test++

	}
}

main();
