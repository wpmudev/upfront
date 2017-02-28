<?php


/**
 * Individual post item markup generation.
 * Takes care of the post parts template expansion.
 */
abstract class Upfront_Post_Data_PartView extends Upfront_PostPart_View {

	const DEFAULT_DATA_TYPE = 'post_data';

	protected $_data = array();
	protected $_post;
	protected $_editor = false;

	protected static $_parts = array();

	public function __construct ($data=array()) {
		$this->_data = $data;
	}

	/**
	 * Main public method.
	 * Expands each part of the post parts and constructs markup string,
	 * then wraps it in post wrapper.
	 * @param object WP_Post object instance
	 * @param bool Is editor or not
	 * @return string Rendered post markup
	 */
	public function get_markup ($post, $editor = false) {
		if (empty($post)) return false;
		$this->_post = $post;
		$this->_editor = $editor;

		// Allow compatibility layer to force only needed parts
		$post_parts = apply_filters('upfront-override_post_parts', false, $post->post_type);
		if (empty($post_parts)) {
			$post_parts = self::get_default_parts($this->_data);
		}

		//$disabled_post_parts = !empty($this->_data['hidden_parts']) ? $this->_data['hidden_parts'] : array();
		$parts = array();
		foreach ($post_parts as $part) {
			//if (in_array($part, $disabled_post_parts)) continue;
			$method = "expand_{$part}_template";
			if (method_exists($this, $method)) $parts[$part] = $this->$method();
			else $parts[$part] = apply_filters('upfront_postdata-' . $method, '', $post);
		}

		// Also expand postmeta codes outside the meta element
		//$out = Upfront_Codec::get('postmeta')->expand_all($out, $post);

		return $parts;
	}

	public function get_propagated_classes () {
		return array();
	}

	public function get_property ($prop) {
		if ( isset($this->_data[$prop]) ) return $this->_data[$prop];
		return false;
	}

	/**
	 * Fetches array of supported post parts.
	 * @return array A list of known parts.
	 */
	public static function get_default_parts ($data) {
		$class_name = self::_get_view_class($data);
		$class_vars = get_class_vars($class_name);
		return $class_vars['_parts'];
	}

	/**
	 * Loads post part template from a file.
	 * @param string $slug Post part template slug
	 * @return string Loaded template
	 */
	protected function _get_template ($slug) {
		return Upfront_Post_Data_Data::get_template($slug, $this->_data);
	}

	/**
	 * Gets fallback markup for a part block
	 *
	 * @param string $msg Fallback message to render
	 * @param string $part Optional part for fallback designation
	 *
	 * @return string Fallback markup
	 */
	protected function _get_fallback_block ($msg, $part=false) {
		$markup = '';
		if (defined('DOING_AJAX') && DOING_AJAX && Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			$part_class = !empty($part)
				? sanitize_html_class($part)
				: ''
			;
			$markup = '<div class="upfront-part-fallback ' . $part_class . '"><em>' . esc_html($msg) . '</em></div>';
		}
		return $markup;
	}


	/**
	 * Returns post full content, with filters applied.
	 * @return string Final post full content.
	 */
	protected function _get_content () {
		self::$_current = $this;
		$content = parent::_get_content();
		self::$_current = null;
		return $content;
	}

	/**
	 * Get view class responsible for rendering
	 * @param array $data Data array
	 * @return string The class name
	 */
	public static function _get_view_class ($data) {
		$data_type = !empty($data['data_type']) ? $data['data_type'] : self::DEFAULT_DATA_TYPE;
		$class_name = get_class() . '_' . self::_normalize_type_to_class($data_type);
		if (!class_exists($class_name)) $class_name = get_class() . '_' . self::_normalize_type_to_class(self::DEFAULT_DATA_TYPE);
		return $class_name;
	}

	private static function _normalize_type_to_class ($type) {
		$type_strings = explode('_', $type);
		$type_strings = array_map('ucfirst', $type_strings);
		return join('_', $type_strings);
	}


	public static function get_post_image_markup($data) {
		global $post;
		if( !is_object( $post ) ) return;
		$style_variant =  Upfront_ChildTheme::get_image_variant_by_id( $data->uf_variant );
		// if no variant is found, default to the first variant
		if ( $style_variant === array() ) {
			$current_variants = Upfront_ChildTheme::getPostImageVariants();
			$style_variant = $current_variants[0];
		}
		$style_variant =  (object) $style_variant;
		$style_variant->label_id = !empty( $style_variant->label ) ? "ueditor-image-style-" . str_replace(" ", "-", trim(strtolower( $style_variant->label )))  : $style_variant->vid;

		// Old compatibility with this_post
		$layout_data = Upfront_ThisPostView::find_postlayout("single", $post->post_type, $post->ID);
		$options = !empty($layout_data['partOptions']) ? $layout_data['partOptions'] : array();

		$padding_left = $padding_right = 0;
		$col_size = isset($layout_data['colSize']) ? $layout_data['colSize'] : 45;
		if(isset($options['contents'])){
			$padding_left = isset( $options['contents']['padding_left'] ) ? $options['contents']['padding_left'] : 0;
			$padding_right = isset( $options['contents']['padding_right'] ) ? $options['contents']['padding_right'] : 0;
		}

		// New post part view
		$style_variant->marginLeft = 0;
		$style_variant->marginRight = 0;
		if ( self::$_current ) {
			$grid = Upfront_Grid::get_grid();
			$breakpoint = $grid->get_default_breakpoint();
			$col_size = $breakpoint->get_column_width();
			$col_padding = $breakpoint->get_column_padding();

			$col = self::$_current->_get_object_col('content');
			$padding_left = isset(self::$_current->_data['left_indent']) ? self::$_current->_data['left_indent'] : 0;
			$padding_right = isset(self::$_current->_data['right_indent']) ? self::$_current->_data['right_indent'] : 0;

			$half = (int)(($col - 1) / 2);
			if ( $padding_left > 0 && $padding_left <= $half ) {
				$style_variant->marginLeft = (( $padding_left * $col_size * -1 ) - $col_padding) . 'px';
			}
			if ( $padding_right > 0 ) {
				$style_variant->marginRight = (( $padding_right * $col_size * -1 ) - $col_padding) . 'px';
			}
		}

		if ($style_variant && isset( $style_variant->group ) && isset( $style_variant->group->float )) {
			$style_variant->group->marginLeft = $style_variant->group->marginRight = 0;
			if ( $style_variant->group->float == 'left' && $padding_left > 0 ){
				$style_variant->group->marginLeft = ( $padding_left - abs($style_variant->group->margin_left) ) * $col_size;
				$style_variant->group->marginRight = 0;
			}
			else if ( $style_variant->group->float == 'right' && $padding_right > 0 ){
				$style_variant->group->marginRight = ( $padding_right - abs($style_variant->group->margin_right) ) * $col_size;
				$style_variant->group->marginLeft = 0;
			}
			else if ( $style_variant->group->float == 'none' && $padding_left > 0 ){
				$style_variant->group->marginLeft = ( $padding_left - abs($style_variant->group->margin_left) + abs($style_variant->group->left) ) * $col_size;
				$style_variant->group->marginRight = 0;
			}
		}
		$data->caption = trim( $data->caption );

		$markup = upfront_get_template(
			'post-image-insert',
			array(
				"style" => $style_variant,
				"data" => $data,
			),
			dirname(dirname(__FILE__)) . '/tpl/post-image-insert.php'
		);
		return $markup;
	}

	/**
	 * Find object and get the columns
	 */
	protected function _get_object_col ($type) {
		$grid = Upfront_Grid::get_grid();
		$breakpoint = $grid->get_default_breakpoint();
		$width_pfx = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
		if ( empty($this->_data['objects']) ) return $breakpoint->get_columns();

		foreach ( $this->_data['objects'] as $object ) {
			$part_type = upfront_get_property_value('part_type', $object);
			if ( $type != $part_type ) continue;
			$class = upfront_get_property_value('class', $object);
			$col = upfront_get_class_num($width_pfx, $class);
			break;
		}
		return isset($col) && is_numeric($col) ? $col : $breakpoint->get_columns();
	}
}


require_once('parts/class_upfront_post_data_partview_author.php');
require_once('parts/class_upfront_post_data_partview_comments.php');
require_once('parts/class_upfront_post_data_partview_featured_image.php');
require_once('parts/class_upfront_post_data_partview_meta.php');
require_once('parts/class_upfront_post_data_partview_post_data.php');
require_once('parts/class_upfront_post_data_partview_taxonomy.php');
