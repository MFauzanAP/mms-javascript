const API = require('./API');

//	Declare variables
let grid = [...new Array(API.mazeHeight()).keys()].map(y => [...new Array(API.mazeHeight()).keys()].map(x => `?`));
let floodGrid = [...new Array(API.mazeHeight()).keys()].map(y => [...new Array(API.mazeHeight()).keys()].map(x => 0));
let crossroads = {};
let coords = [ 0, API.mazeHeight() - 1 ];
let dir = 0;
let prevCrossroads = [];
let undiscovered = API.mazeWidth() * API.mazeHeight();
let start = [ 0, API.mazeHeight() - 1 ];
let explored = false;

function log(text) {
	console.error(text);
}

function moveForward(n = 1) {

	//	Move forward
	API.moveForward(n);

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

function withinBounds(coords) {

	//	Check if too far north
	if (coords[1] < 0) return false;

	//	Check if too far south
	if (coords[1] >= API.mazeHeight()) return false;

	//	Check if too far west
	if (coords[0] < 0) return false;

	//	Check if too far east
	if (coords[0] >= API.mazeWidth()) return false;

	//	Else return true
	return true;

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

function followPath(dest, path) {

	//	Declare list of actions to take
	const actions = [];

	//	Go through path
	while (path != undefined) {

		//	Add action to list
		actions.push(path[4]);

		//	Go to next path
		path = path[1];

	}

	//	Go through each action from reverse order
	for (let i = actions.length - 2; i >= 0; i--) {

		//	Go through the next few same actions
		const action = actions[i];
		let temp = actions[i];
		let j = i;
		let count = 0;
		while (temp == action) {

			//	Get the next action
			temp = actions[j];
			if (temp !== action) break;

			//	Increment count and j
			j--;
			count++;

		}

		//	Rotate and move
		faceDir(action);
		moveForward();
		if (explored) API.setColor(coords[0], API.mazeHeight() - coords[1] - 1, 'G');

	}

}

function pathfind(target) {

	//	Declare variables
	const open = [ [ coords, undefined, 0, 0, null ] ];
	const close = [];

	//	Pathfinding loop
	while (open.length > 0) {

		//	Get node with least cost
		const bestNode = open[open.length - 1];

		//	Remove from open list
		open.pop();

		//	Get current cell
		const nodeCoords = bestNode[0];
		const cell = grid[nodeCoords[1]][nodeCoords[0]];

		//	Check north
		if (cell[0] == '0' && grid[nodeCoords[1] - 1]) {

			//	Get node
			let n = [ [ nodeCoords[0], nodeCoords[1] - 1 ], bestNode, 0, 0, 0 ];
			if (n[0].join(' ') == target.join(' ')) {
				followPath(close, n);
				return;
			}
			
			//	Calculate score
			n[2] = bestNode[2] + 1;
			n[3] = Math.abs(n[0][0] - target[0]) + Math.abs(n[0][1] - target[1]);

			//	If this cell is alr in the open list and has a higher score
			const openCell = open.filter(cell => cell[0].join(' ') == n[0].join(' '))[0];
			const closeCell = close.filter(cell => cell[0].join(' ') == n[0].join(' '))[0];
			if (!(openCell && openCell[2] + openCell[3] < n[2] + n[3]) && !(closeCell && closeCell[2] + closeCell[3] < n[2] + n[3])) {

				//	Add to open list
				open.push(n);
				open.sort((a, b) => (b[2] + b[3]) - (a[2] + a[3]));

			}

		}

		//	Check east
		if (cell[1] == '0') {

			//	Get node
			let e = [ [ nodeCoords[0] + 1, nodeCoords[1] ], bestNode, 0, 0, 3 ];
			if (e[0].join(' ') == target.join(' ')) {
				followPath(close, e);
				return;
			}
			
			//	Calculate score
			e[2] = bestNode[2] + 1;
			e[3] = Math.abs(e[0][0] - target[0]) + Math.abs(e[0][1] - target[1]);

			//	If this cell is alr in the open list and has a higher score
			const openCell = open.filter(cell => cell[0].join(' ') == e[0].join(' '))[0];
			const closeCell = close.filter(cell => cell[0].join(' ') == e[0].join(' '))[0];
			if (!(openCell && openCell[2] + openCell[3] < e[2] + e[3]) && !(closeCell && closeCell[2] + closeCell[3] < e[2] + e[3])) {

				//	Add to open list
				open.push(e);
				open.sort((a, b) => (b[2] + b[3]) - (a[2] + a[3]));

			}

		}

		//	Check south
		if (cell[2] == '0' && grid[nodeCoords[1] + 1]) {

			//	Get node
			let s = [ [ nodeCoords[0], nodeCoords[1] + 1 ], bestNode, 0, 0, 2 ];
			if (s[0].join(' ') == target.join(' ')) {
				followPath(close, s);
				return;
			}
			
			//	Calculate score
			s[2] = bestNode[2] + 1;
			s[3] = Math.abs(s[0][0] - target[0]) + Math.abs(s[0][1] - target[1]);

			//	If this cell is alr in the open list and has a higher score
			const openCell = open.filter(cell => cell[0].join(' ') == s[0].join(' '))[0];
			const closeCell = close.filter(cell => cell[0].join(' ') == s[0].join(' '))[0];
			if (!(openCell && openCell[2] + openCell[3] < s[2] + s[3]) && !(closeCell && closeCell[2] + closeCell[3] < s[2] + s[3])) {

				//	Add to open list
				open.push(s);
				open.sort((a, b) => (b[2] + b[3]) - (a[2] + a[3]));

			}

		}

		//	Check west
		if (cell[3] == '0') {

			//	Get node
			let w = [ [ nodeCoords[0] - 1, nodeCoords[1] ], bestNode, 0, 0, 1 ];
			if (w[0].join(' ') == target.join(' ')) {
				followPath(close, w);
				return;
			}
			
			//	Calculate score
			w[2] = bestNode[2] + 1;
			w[3] = Math.abs(w[0][0] - target[0]) + Math.abs(w[0][1] - target[1]);

			//	If this cell is alr in the open list and has a higher score
			const openCell = open.filter(cell => cell[0].join(' ') == w[0].join(' '))[0];
			const closeCell = close.filter(cell => cell[0].join(' ') == w[0].join(' '))[0];
			if (!(openCell && openCell[2] + openCell[3] < w[2] + w[3]) && !(closeCell && closeCell[2] + closeCell[3] < w[2] + w[3])) {

				//	Add to open list
				open.push(w);
				open.sort((a, b) => (b[2] + b[3]) - (a[2] + a[3]));

			}

		}

		//	Add to closed list
		close.push(bestNode);

	}

}

function generateFloodGrid(target) {

	//	Declare variables
	let memo = { };
	let list = target;
	let dist = 0;

	//	Keep repeating untill all cells are updated
	while (Object.keys(memo).length < API.mazeWidth() * API.mazeHeight()) {

		//	Declare temporary list
		const tempList = [];

		//	Loop through the list of cells to update
		for (let i = 0; i < list.length; i++) {

			//	Get coords
			const coord = list[i];

			//	Get cell
			const cell = grid[coord[1]][coord[0]];

			//	Get coordinates in string form
			const stringCoords = list[i].join(' ');

			//	Check if this cell is already mapped
			if (memo[stringCoords] == undefined) { 
				
				//	Add to memo
				memo[stringCoords] = dist;

				//	Update cell in grid
				floodGrid[coord[1]][coord[0]] = dist;
				API.setText(coord[0], API.mazeHeight() - coord[1] - 1, dist);

				//	Get adjacent cells
				const n = [ coord[0], coord[1] - 1 ];
				const e = [ coord[0] + 1, coord[1] ];
				const s = [ coord[0], coord[1] + 1 ];
				const w = [ coord[0] - 1, coord[1] ];

				//	Add adjacent cells to temp list if not already in list or memo and if accessible
				if (withinBounds(n) && memo[n.join(' ')] == undefined && grid[n[1]][n[0]][2] != '1') tempList.push(n);
				if (withinBounds(e) && memo[e.join(' ')] == undefined && grid[e[1]][e[0]][3] != '1') tempList.push(e);
				if (withinBounds(s) && memo[s.join(' ')] == undefined && grid[s[1]][s[0]][0] != '1') tempList.push(s);
				if (withinBounds(w) && memo[w.join(' ')] == undefined && grid[w[1]][w[0]][1] != '1') tempList.push(w);
				// if (withinBounds(n) && grid[n[1]][n[0]][0][2] == '1') { log(n); log('n'); log(tempList.includes(n)) }
				// if (withinBounds(e) && grid[e[1]][e[0]][0][3] == '1') { log(e); log('e'); log(tempList.includes(e)) }
				// if (withinBounds(s) && grid[s[1]][s[0]][0][0] == '1') { log(s); log('s'); log(tempList.includes(s)) }
				// if (withinBounds(w) && grid[w[1]][w[0]][0][1] == '1') { log(w); log('w'); log(tempList.includes(w)) }

			}

		}

		//	Replace old list with new one
		list = [ ...tempList ];

		//	Increment distance
		dist++;

	}

}

function moveToLeastValue() {

	//	Keep looping until robot is at target
	while (floodGrid[coords[1]][coords[0]] != 0) {
	
		//	Get current cell
		const cell = grid[coords[1]][coords[0]];

		//	Get adjacent coords
		const coordN = [ coords[0], coords[1] - 1 ];
		const coordE = [ coords[0] + 1, coords[1] ];
		const coordS = [ coords[0], coords[1] + 1 ];
		const coordW = [ coords[0] - 1, coords[1] ];

		//	Get the cell with the least value
		let min = Infinity;
		let dir = 0;
		if (withinBounds(coordN) && cell[0] != '1' && floodGrid[coordN[1]][coordN[0]] < min) { min = floodGrid[coordN[1]][coordN[0]]; dir = 0; }
		if (withinBounds(coordE) && cell[1] != '1' && floodGrid[coordE[1]][coordE[0]] < min) { min = floodGrid[coordE[1]][coordE[0]]; dir = 3; }
		if (withinBounds(coordS) && cell[2] != '1' && floodGrid[coordS[1]][coordS[0]] < min) { min = floodGrid[coordS[1]][coordS[0]]; dir = 2; }
		if (withinBounds(coordW) && cell[3] != '1' && floodGrid[coordW[1]][coordW[0]] < min) { min = floodGrid[coordW[1]][coordW[0]]; dir = 1; }

		//	Rotate and move robot
		faceDir(dir);
		moveForward();

	}

}

function main() {
	log('Running...');
	API.setColor(0, 0, 'G');
	API.setText(0, 0, 'START');

	//	Main simulator loop
	while (undiscovered > 0 || (undiscovered == 0 && coords.join(' ') != start.join(' '))) {

		//	Get current cell
		let cell = grid[coords[1]][coords[0]];

		//	If this cell is undiscovered
		if (cell === '?') {

			//	Check for walls
			let walls = [ API.wallFront() ? 1 : 0, API.wallRight() ? 1 : 0, 0, API.wallLeft() ? 1 : 0 ];
			walls = [ ...walls.slice(dir), ...walls.slice(0, dir) ];

			if (walls[0] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 'n');
			if (walls[1] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 'e');
			if (walls[2] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 's');
			if (walls[3] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 'w');

			//	Add to grid
			grid[coords[1]][coords[0]] = walls.join('');
			cell = grid[coords[1]][coords[0]];
			API.setColor(coords[0], API.mazeHeight() - coords[1] - 1, 'G');
			API.setText(coords[0], API.mazeHeight() - coords[1] - 1, cell);

			//	Decrement undiscovered count
			undiscovered--;

		}

		//	Get possible paths
		const paths = getPossiblePaths(coords);

		//	If there are no more possible paths
		if (paths.length === 0) {

			pathfind(prevCrossroads[prevCrossroads.length - 1].split(' '));

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

	}

	//	All discovered
	log('maze explored!');
	explored = true;
	API.clearAllColor();
	API.clearAllText();
	generateFloodGrid([
		[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) ],
		[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) ],
		[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) - 1 ],
		[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) - 1 ],
	]);
	moveToLeastValue();

}

main();
