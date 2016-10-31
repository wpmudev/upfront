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
			$posts_markup[$post->ID] = $view->get_markup($post);
		}

		return $posts_markup;
	}

	/**
	 * Fetches final posts markup, wrapped as string.
	 * @param array $data The properties data array
	 * @param bool $editor Whether on editor or not
	 * @return string Final posts element markup.
	 */
	public static function get_markup ($data, $editor = false) {
		$posts = self::get_posts_markup($data);

		return $posts;

		/*if (!empty($posts)) {
			return '' .
				'<ul class="uf-posts">' . join('', $posts) . '</ul>' .
				self::get_pagination($data) .
			'';

		}*/

		return '';
	}

	public static function get_pagination ($data) {
		if ('list' !== $data['display_type']) return '';
		if (empty($data['pagination'])) return '';

		$pagination = '';
		$pagination_type = sanitize_html_class($data['pagination']);
		if ('numeric' === $pagination_type) $pagination = self::_get_numeric_pagination($data);
		if ('arrows' === $pagination_type) $pagination = self::_get_arrow_pagination($data);

		return !empty($pagination)
			? "<div class='uf-pagination {$pagination_type}'>{$pagination}</div>"
			: ''
		;
	}

	private static function _get_numeric_pagination ($data) {
		global $wp_query;

		$old_query = clone($wp_query);
		$query = Upfront_Posts_Model::spawn_query($data);
		if (empty($query)) return '';

		$wp_query = $query;

		$big = 999999999999999999;
		$args = array(
			'base' => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
			'format' => '?paged=%#%',
			'current' => max( 1, get_query_var('paged') ),
			'total' => $wp_query->max_num_pages
		);
		if ($query->is_search) {
			$args['add_args'] = array(
				's' => get_query_var('s'),
			);
		}
		$pagination = paginate_links();
		$wp_query = $old_query;

		return $pagination;
	}

	private static function _get_arrow_pagination ($data) {
		global $wp_query, $paged;

		$old_query = clone($wp_query);
		$query = Upfront_Posts_Model::spawn_query($data);
		if (empty($query)) return '';

		$wp_query = $query;
		$paged = get_query_var('paged');

		$pagination = get_posts_nav_link();
		$wp_query = $old_query;

		return $pagination;
	}


}
