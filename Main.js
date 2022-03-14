const API = require('./API');

//	Declare variables
let grid = [...new Array(API.mazeHeight()).keys()].map(y => [...new Array(API.mazeHeight()).keys()].map(x => [ '0000', 0 ]));
let started = false;
let coords = [ 0, API.mazeHeight() - 1 ];
let dir = 0;
let prevCrossroads = [];
let undiscovered = API.mazeWidth() * API.mazeHeight();
let start = [ 0, API.mazeHeight() - 1 ];
let target = [
	[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) ].join(' '),
	[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) ].join(' '),
	[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) - 1 ].join(' '),
	[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) - 1 ].join(' '),
];

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

function checkWalls() {

	//	Check for walls based on car direction
	let walls = [
		API.wallFront() ? 1 : 0,
		API.wallRight() ? 1 : 0,
		coords.join(' ') == start.join(' ') && !started ? 1 : 0,
		API.wallLeft() ? 1 : 0
	];

	//	Normalise to nesw
	walls = [ ...walls.slice(dir), ...walls.slice(0, dir) ];

	//	Update grid
	grid[coords[1]][coords[0]] = [ walls.join(''), 0 ];
	if (walls[0] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 'n');
	if (walls[1] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 'e');
	if (walls[2] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 's');
	if (walls[3] == 1) API.setWall(coords[0], API.mazeHeight() - coords[1] - 1, 'w');

	//	Set flag
	started = true;

}

function updateMaze(target) {

	//	Clear text
	// API.clearAllText();

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
				grid[coord[1]][coord[0]] = [ cell[0], dist ];
				API.setText(coord[0], API.mazeHeight() - coord[1] - 1, dist);

				//	Get adjacent cells
				const n = [ coord[0], coord[1] - 1 ];
				const e = [ coord[0] + 1, coord[1] ];
				const s = [ coord[0], coord[1] + 1 ];
				const w = [ coord[0] - 1, coord[1] ];

				//	Add adjacent cells to temp list if not already in list or memo and if accessible
				if (withinBounds(n) && memo[n.join(' ')] == undefined && grid[n[1]][n[0]][0][2] != '1') tempList.push(n);
				if (withinBounds(e) && memo[e.join(' ')] == undefined && grid[e[1]][e[0]][0][3] != '1') tempList.push(e);
				if (withinBounds(s) && memo[s.join(' ')] == undefined && grid[s[1]][s[0]][0][0] != '1') tempList.push(s);
				if (withinBounds(w) && memo[w.join(' ')] == undefined && grid[w[1]][w[0]][0][1] != '1') tempList.push(w);
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

	//	Get current cell
	const cell = grid[coords[1]][coords[0]];

	//	Get adjacent coords
	const coordN = [ coords[0], coords[1] - 1 ];
	const coordE = [ coords[0] + 1, coords[1] ];
	const coordS = [ coords[0], coords[1] + 1 ];
	const coordW = [ coords[0] - 1, coords[1] ];

	//	Get adjacent cells
	const n = withinBounds(coordN) && cell[0][0] != '1' ? grid[coordN[1]][coordN[0]] : undefined;
	const e = withinBounds(coordE) && cell[0][1] != '1' ? grid[coordE[1]][coordE[0]] : undefined;
	const s = withinBounds(coordS) && cell[0][2] != '1' ? grid[coordS[1]][coordS[0]] : undefined;
	const w = withinBounds(coordW) && cell[0][3] != '1' ? grid[coordW[1]][coordW[0]] : undefined;

	//	Get the cell with the least value
	let min = Infinity;
	let dir = 0;
	if (n && n.join(' ') != start.join(' ') && n[1] < min) { min = n[1]; dir = 0; }
	if (e && e.join(' ') != start.join(' ') && e[1] < min) { min = e[1]; dir = 3; }
	if (s && s.join(' ') != start.join(' ') && s[1] < min) { min = s[1]; dir = 2; }
	if (w && w.join(' ') != start.join(' ') && w[1] < min) { min = w[1]; dir = 1; }

	//	Rotate and move robot
	faceDir(dir);
	moveForward();

}

function main() {
	log('Running...');
	API.setColor(0, 0, 'G');
	API.setText(0, 0, 'START');

	//	Main loop
	while (!target.includes(coords.join(' '))) {

		//	Check for walls
		checkWalls();

		//	Update maze values
		updateMaze([
			[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) ],
			[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) ],
			[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) - 1 ],
			[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) - 1 ],
		]);

		//	Move to cell with next smallest value
		moveToLeastValue();

	}

	//	Go back to start
	while (start.join(' ') != coords.join(' ')) {

		//	Check for walls
		checkWalls();

		//	Update maze values
		updateMaze([ start ]);

		//	Move to cell with next smallest value
		moveToLeastValue();

	}

	//	Go to center
	while (!target.includes(coords.join(' '))) {

		//	Check for walls
		checkWalls();

		//	Update maze values
		updateMaze([
			[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) ],
			[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) ],
			[ Math.floor(API.mazeWidth() / 2), Math.floor(API.mazeHeight() / 2) - 1 ],
			[ Math.floor(API.mazeWidth() / 2) - 1, Math.floor(API.mazeHeight() / 2) - 1 ],
		]);

		//	Move to cell with next smallest value
		moveToLeastValue();

	}

	//	Go back to start
	while (start.join(' ') != coords.join(' ')) {

		//	Check for walls
		checkWalls();

		//	Update maze values
		updateMaze([ start ]);

		//	Move to cell with next smallest value
		moveToLeastValue();

	}

}

main();
