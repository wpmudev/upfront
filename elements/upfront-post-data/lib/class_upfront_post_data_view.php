<?php


/**
 * Overall post data view class.
 * Used for internal markup generation, for both back and front views.
 */
class Upfront_Post_Data_View {

	/**
	 * Fetch post rendered markups.
	 * @param array $data The properties data array
	 * @return string Parsed markup items for each post in the list.
	 */
	public static function get_post_markup ($data) {
		$post = self::_get_post($data);
		$view_class = Upfront_Post_Data_PartView::_get_view_class($data);
		$view = new $view_class($data);

		return $view->get_markup($post);
	}
	
	protected static function _get_post ($data) {
		$post = Upfront_Post_Data_Model::get_post( is_numeric($data['post_id']) && $data['post_id'] > 0 ? $data['post_id'] : null );
		return $post;
	}

}
