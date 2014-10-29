<?php

class Upfront_Layout_Maker {
	var $regions = array();

	function add(Upfront_Virtual_Region $r){
		$this->regions[] = $r;
	}

	function create_layout(){
		$post_main = false;
		// Track added regions cause lightboxes might be included multiple times
		$added_regions = array();
		foreach($this->regions as $r){
			$region = $r->get_data();

			if (in_array($region['name'], $added_regions)) continue;
			$added_regions[] = $region['name'];

			if($region['name'] == 'main'){
				$region['position'] = 10;
				$region['default'] = true;
				$region['container'] = 'main';
				$post_main = true;
			}
			else
				$region['position'] = $post_main ? 20 : 1;

			$side_regions_before = array();
			$side_regions_after = array();

			foreach($r->side_regions as $sr){
				$sidedata = $sr->get_data();
				$sidedata['position'] += $region['position'];
				//$regions[] = $sidedata;
				if ( $sidedata['position'] < $region['position'] )
					$side_regions_before[] = $sidedata;
				else
					$side_regions_after[] = $sidedata;
			}
			usort($side_regions_before, array('Upfront_Theme', '_sort_region'));
			usort($side_regions_after, array('Upfront_Theme', '_sort_region'));

			foreach($side_regions_before as $side){
				$regions[] = $side;
			}

			$regions[] = $region;

			foreach($side_regions_after as $side){
				$regions[] = $side;
			}
		}
		return $regions;
	}
}