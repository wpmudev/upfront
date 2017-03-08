<?php

// Uses WP Walker_Page from wp-includes/class-walker-page.php to sort pages by hierarchy.
class Upfront_Posts_Walker extends Walker_Page {
	// Instead of $output, lets keep it an array for a JSON response.
	public $list = array();

	public function walk($elements, $max_depth = 0) {
		parent::walk($elements, $max_depth);
		// Return the list instead of $output.
		return $this->list;
	}
	
	// Keep from unnecessary processing of $output.
	public function start_lvl( &$output, $depth = 0, $args = array() ) {
	}
	// Keep from unnecessary processing of $output.
	public function end_lvl( &$output, $depth = 0, $args = array() ) {
	}

	public function start_el(&$output, $item, $depth = 0, $args = array(), $id = 0) {
		// Add Depth for use with indentation.
		$item->depth = $depth;
		$this->list[] = $item;
	}

	// Keep from unnecessary processing of $output.
	public function end_el($output, $item, $depth = 0, $args = array(), $id = 0) {
	}
}
