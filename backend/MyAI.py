from AI import AI
from Action import Action
import time


class MyAI( AI ):

	def __init__(self, rowDimension, colDimension, totalMines, startX, startY):
		self.rowCount = colDimension
		self.columnCount = rowDimension
		self.moveCount = 0
		self.minesRemaining = totalMines
		self.flagFrontier = set()
		self.moreThanZeroFrontier = {}
		self.remainingTiles = [(row, column) for row in range(colDimension) for column in range(rowDimension)]
		self.zerosFrontier = []
		self.lastMove = (startX, startY)
		self.coveredNeighborsReduction = {}

		# Create board to record moves and results
		self.board = [['x'] * rowDimension for _ in range(colDimension)]
		self.board[startX][startY] = 0
		self.remainingTiles.remove((startX, startY))

					
	def addNeighborsToFrontier(self, row, column):
		neighbors = self.getCoveredNeighbors(row, column)
		for neighbor in neighbors:
			if neighbor not in self.zerosFrontier:
				self.zerosFrontier.append(neighbor)

	def getCoveredNeighbors(self, row, column):
		neighbors = set()
		for x in range(max(0, row-1), min(self.rowCount, row+2)): 
			for y in range(max(0, column-1), min(self.columnCount, column+2)):
				if (x, y) in self.remainingTiles:
					neighbors.add((x, y))
		return neighbors

	def getUncoveredNeighbors(self, row, column):
		neighbors = set()
		for x in range(max(0, row-1), min(self.rowCount, row+2)): 
			for y in range(max(0, column-1), min(self.columnCount, column+2)):
				if (x, y) not in self.remainingTiles:
					neighbors.add((x, y))
		neighbors.remove((row, column))
		return neighbors

	def getHalfUncoveredNeighbors(self, row, column):
		neighbors = set()
		for x in range(max(0, row-1), min(self.rowCount, row+2)): 
			for y in range(column, min(self.columnCount, column+2)):
				if (x, y) not in self.remainingTiles:
					neighbors.add((x, y))
		neighbors.remove((row, column))
		if row-1 >= 0 and (row-1, column) in neighbors:
			neighbors.remove((row-1, column))
		return neighbors

	def getMoreThanZeroNeighbors(self, row, column):
		neighbors = {}
		for x in range(max(0, row-1), min(self.rowCount, row+2)): 
			for y in range(max(0, column-1), min(self.columnCount, column+2)):
				if (x, y) in self.moreThanZeroFrontier.keys():
					neighbors[(x, y)] = self.moreThanZeroFrontier[(x, y)]
		if (row, column) in neighbors:
			neighbors.pop((row, column))
		return neighbors

	def updateFlagNeighbors(self, row, column):
		neighbors = self.getUncoveredNeighbors(row, column)
		for neighbor in neighbors:
			if self.board[neighbor[0]][neighbor[1]] != -1:
				self.board[neighbor[0]][neighbor[1]] = int(self.board[neighbor[0]][neighbor[1]]) - 1
			if neighbor in self.moreThanZeroFrontier:
				self.moreThanZeroFrontier[neighbor] -= 1
				if self.moreThanZeroFrontier[neighbor] == 0:
					self.moreThanZeroFrontier.pop(neighbor)
					self.addNeighborsToFrontier(neighbor[0], neighbor[1])
		coveredNeighbors = self.getCoveredNeighbors(row, column)
		for neighbor in coveredNeighbors:
			if neighbor in self.coveredNeighborsReduction:
				self.coveredNeighborsReduction[neighbor] += 1
			else:
				self.coveredNeighborsReduction[neighbor] = 1
		
	def addFlagsToFlagFrontier(self, row, column, number):
		if number == 1:
			if row-1 >= 0 and column - 1 >= 0 and row+1 < self.rowCount and column+1 < self.columnCount:
				if self.board[row-1][column] == 0:
					if self.board[row][column-1] == 0:
						if (row+1, column+1) not in self.flagFrontier: # Might be removable
							self.flagFrontier.add((row+1, column+1))
					elif self.board[row][column+1] == 0:
						if (row+1, column-1) not in self.flagFrontier:
							self.flagFrontier.add((row+1, column-1))
				elif self.board[row+1][column] == 0:
					if self.board[row][column+1] == 0:
						if (row-1, column-1) not in self.flagFrontier:
							self.flagFrontier.add((row-1, column-1))
					elif  self.board[row][column-1] == 0:
						if (row-1, column+1) not in self.flagFrontier:
							self.flagFrontier.add((row-1, column+1))
		
		possible_flags = self.getCoveredNeighbors(row, column)
		if len(possible_flags) == number:
			for flag in possible_flags:
				if flag not in self.flagFrontier:
					self.flagFrontier.add(flag)

    
	def forward_checking(self, time_limit=20):
		start_time = time.time()
		all_possible_combinations = set()

		covered_neighbors_cache = {}
		more_than_zero_neighbors_cache = {}

		def get_cached_covered_neighbors(row, col):
			if (row, col) not in covered_neighbors_cache:
				covered_neighbors_cache[(row, col)] = self.getCoveredNeighbors(row, col)
			return covered_neighbors_cache[(row, col)]

		def get_cached_more_than_zero_neighbors(row, col):
			if (row, col) not in more_than_zero_neighbors_cache:
				more_than_zero_neighbors_cache[(row, col)] = self.getMoreThanZeroNeighbors(row, col)
			return more_than_zero_neighbors_cache[(row, col)]

		def is_complete_combination_valid(comb):
			for (row, col), required_mines in self.moreThanZeroFrontier.items():
				covered_neighbors = get_cached_covered_neighbors(row, col)
				mine_count = sum((r, c) in comb for r, c in covered_neighbors)
				if mine_count != required_mines:
					return False
			return True

		partial_valid_cache = {}

		def is_partial_combination_valid(current_comb, recent_tile, remaining_tiles):
			if recent_tile in partial_valid_cache:
				return partial_valid_cache[recent_tile]

			row, col = recent_tile
			for (r, c), required_mines in get_cached_more_than_zero_neighbors(row, col).items():
				covered_neighbors = get_cached_covered_neighbors(r, c)
				if (row, col) in covered_neighbors:
					mine_count = sum((nr, nc) in current_comb for nr, nc in covered_neighbors)
					remaining_covered_neighbors = len([tile for tile in covered_neighbors if (tile not in current_comb and tile in remaining_tiles)])
					if mine_count > required_mines or mine_count + remaining_covered_neighbors < required_mines:
						partial_valid_cache[recent_tile] = False
						return False
			partial_valid_cache[recent_tile] = True
			return True

		def generate_combinations(current_comb, remaining_tiles):
			if time.time() - start_time > time_limit:
				return
			if not remaining_tiles:
				if is_complete_combination_valid(current_comb):
					all_possible_combinations.add(frozenset(current_comb))
				return

			tile = next(iter(remaining_tiles))

			if is_partial_combination_valid(current_comb, tile, remaining_tiles):
				generate_combinations(current_comb, remaining_tiles - {tile})

				current_comb.add(tile)
				if is_partial_combination_valid(current_comb, tile, remaining_tiles - {tile}):
					generate_combinations(current_comb, remaining_tiles - {tile})
				current_comb.remove(tile)

		def find_connected_frontiers(frontier_tiles):
			frontiers = []
			visited = set()

			def bfs(start_tile):
				queue = [start_tile]
				connected_component = set()
				while queue:
					current = queue.pop(0)
					if current not in visited:
						visited.add(current)
						connected_component.add(current)
						neighbors = get_cached_covered_neighbors(*current)
						for neighbor in neighbors:
							if neighbor in frontier_tiles and neighbor not in visited:
								queue.append(neighbor)
				return connected_component

			for tile in frontier_tiles:
				if tile not in visited:
					frontiers.append(bfs(tile))
			
			return frontiers

		frontier_tiles = set()
		for (row, col) in self.moreThanZeroFrontier.keys():
			frontier_tiles.update(get_cached_covered_neighbors(row, col))

		connected_frontiers = find_connected_frontiers(frontier_tiles)

		for frontier in connected_frontiers:
			generate_combinations(set(), frontier)

		return all_possible_combinations

	def make_probabilistic_guess(self, possible_combinations):
		tile_probabilities = {}

		covered_neighbors_set = set()
		for (row, col) in self.moreThanZeroFrontier.keys():
			covered_neighbors_set.update(self.getCoveredNeighbors(row, col))

		for tile in covered_neighbors_set:
			tile_probabilities[tile] = 0

		for comb in possible_combinations:
			for tile in comb:
				tile_probabilities[tile] += 1

		if not tile_probabilities:
			return None, None

		total_combinations = len(possible_combinations)

		min_tile = None
		max_tile = None
		min_prob = float('inf')
		max_prob = float('-inf')

		for tile, prob in tile_probabilities.items():
			if prob < min_prob:
				min_prob = prob
				min_tile = tile
			if prob > max_prob:
				max_prob = prob
				max_tile = tile

		min_probability_stat = (total_combinations - min_prob) / total_combinations
		max_probability_stat = max_prob / total_combinations

		outside_frontier_covered_tiles = set(self.remainingTiles) - tile_probabilities.keys()

		if outside_frontier_covered_tiles:
			frontier_mine_count = (max_prob + min_prob) // 2
			outside_mine_count = self.minesRemaining - frontier_mine_count
			outside_covered_tiles_count = len(outside_frontier_covered_tiles)

			if outside_covered_tiles_count > 0:
				outside_safe_probability = 1 - (outside_mine_count / outside_covered_tiles_count)
				total_remaining_tiles = len(self.remainingTiles)
				frontier_density = len(tile_probabilities) / total_remaining_tiles

				# heuristic threshold for risk/reward utilization ratio
				if (outside_safe_probability > min_probability_stat and
					(max_probability_stat < 0.75 or outside_safe_probability > max_probability_stat)):
					return outside_frontier_covered_tiles.pop(), None



		if min_prob == total_combinations:
			self.flagFrontier.add(min_tile)
		if max_prob == 0 or min_probability_stat / max_probability_stat > 0.7:
			return min_tile, None

		return (min_tile, None) if max_tile is None else (None, max_tile)


	def getAction(self, number: int) -> "Action Object": # type: ignore	
		def flag_from_frontier():
			flag = self.flagFrontier.pop()
			self.lastMove = flag
			self.minesRemaining -= 1
			self.remainingTiles.remove(flag)
			self.updateFlagNeighbors(flag[0], flag[1])
			self.moveCount += 1
			return Action(AI.Action.FLAG, flag[0], flag[1])
		

		# record previous uncover
		if number >= 0 and self.lastMove in self.coveredNeighborsReduction:
			number -= self.coveredNeighborsReduction.pop(self.lastMove)
		if number == 0:
			self.addNeighborsToFrontier(self.lastMove[0], self.lastMove[1])
		elif number > 0:
			self.moreThanZeroFrontier[self.lastMove] = number

		self.board[self.lastMove[0]][self.lastMove[1]] = number
		
		# Uncover all safe tiles
		while self.zerosFrontier:
			tile = self.zerosFrontier.pop()
			self.remainingTiles.remove(tile)
			self.moveCount += 1
			self.lastMove = tile
			return Action(AI.Action.UNCOVER, tile[0], tile[1])
		
		# Uncover all tiles when no mines are left
		while self.minesRemaining == 0:
			while self.remainingTiles:
				tile = self.remainingTiles.pop()
				self.lastMove = tile
				self.board[self.lastMove[0]][self.lastMove[1]] = number
				return Action(AI.Action.UNCOVER, tile[0], tile[1])
			return Action(AI.Action.LEAVE)

		# Find mines and flag them
		for key, num in self.moreThanZeroFrontier.items():
			if not self.flagFrontier:
				self.addFlagsToFlagFrontier(key[0], key[1], num)
			else:
				break
		while self.flagFrontier:
		
			return flag_from_frontier()
		else:
			sorted_data = sorted(self.moreThanZeroFrontier.items(), key=lambda item: item[0])
			inverted_index = {}
			for data in sorted_data:
				b = [value for value in sorted_data if value[0] in self.getHalfUncoveredNeighbors(data[0][0], data[0][1])]
				if b:
					inverted_index[data] = b
			for a in inverted_index:
				for b in inverted_index[a]:
					a_neighbors = self.getCoveredNeighbors(a[0][0], a[0][1])
					b_neighbors = self.getCoveredNeighbors(b[0][0], b[0][1])
					a_not_b = [neighbor for neighbor in a_neighbors if neighbor not in b_neighbors]
					b_not_a = [neighbor for neighbor in b_neighbors if neighbor not in a_neighbors]
					if a[1] - b[1] == len(a_not_b):
						for tile in a_not_b:
							if tile in self.remainingTiles:
								if tile not in self.flagFrontier:
									self.flagFrontier.add(tile)
						for tile in b_not_a:
							if tile in self.remainingTiles:
								if tile not in self.zerosFrontier:
									self.zerosFrontier.append(tile)
									if tile in self.moreThanZeroFrontier:
										self.moreThanZeroFrontier.pop(tile)
					elif b[1] - a[1] == len(b_not_a):
						for tile in b_not_a:
							if tile in self.remainingTiles:
								if tile not in self.flagFrontier:
									self.flagFrontier.add(tile)
						for tile in a_not_b:
							if tile in self.remainingTiles:
								if tile not in self.zerosFrontier:
									self.zerosFrontier.append(tile)
									if tile in self.moreThanZeroFrontier:
										self.moreThanZeroFrontier.pop(tile)

					while self.flagFrontier:
						return flag_from_frontier()
					while self.zerosFrontier:
						tile = self.zerosFrontier.pop()
						self.remainingTiles.remove(tile)
						self.moveCount += 1
						self.lastMove = tile
						return Action(AI.Action.UNCOVER, tile[0], tile[1])


            # Forward Checking

			possible_combinations = self.forward_checking(20)
			if possible_combinations:
				most_likely_safe, most_likely_mine = self.make_probabilistic_guess(possible_combinations)
				if most_likely_safe:
					self.remainingTiles.remove(most_likely_safe)
					self.moveCount += 1
					self.lastMove = most_likely_safe
					return Action(AI.Action.UNCOVER, most_likely_safe[0], most_likely_safe[1])
				elif most_likely_mine:
					if most_likely_mine not in self.flagFrontier:
						self.flagFrontier.add(most_likely_mine)
					return flag_from_frontier()


			# Guess

			tile = self.remainingTiles.pop()
			self.moveCount += 1
			self.lastMove = tile
			return Action(AI.Action.UNCOVER, tile[0], tile[1])