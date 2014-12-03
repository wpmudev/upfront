<?php


/**
 * Overall posts view class.
 * Used for internal markup generation, for both back and front views.
 */
class Upfront_Posts_PostsView {

	/**
	 * Fetch a list of posts rendered markups.
	 * @param array $data The properties data array
	 * @return array Array of parsed markup items for each post in the list.
	 */
	public static function get_posts_markup ($data) {
		$posts = Upfront_Posts_Model::get_posts($data);
		$posts_markup = array();

		$view = new Upfront_Posts_PostView($data);

		foreach($posts as $idx => $post) {
			$posts_markup[$idx] = $view->get_markup($post);
		}

		return $posts_markup;
	}

	/**
	 * Fetches final posts markup, wrapped as string.
	 * @param array $data The properties data array
	 * @return string Final posts element markup.
	 */
	public static function get_markup ($data) {
		$posts = self::get_posts_markup($data);

		return !empty($posts)
			? '<ul>' . join('', $posts) . '</ul>'
			: ''
		;
	}

}