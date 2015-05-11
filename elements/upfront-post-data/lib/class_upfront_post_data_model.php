<?php

/**
 * Post data model factory class.
 */
class Upfront_Post_Data_Model {


	/**
	 * Fetch post
	 * @param  integer $post_id Raw data (element properties)
	 */
	public static function get_post ($post_id = null) {
		$post = get_post($post_id);
			
		return $post;
	}
}
