<?php

class Upfront_PlainTxtView extends Upfront_Object {

	public function get_markup () {

		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$content = $this->_get_property('content');
		
		$preset = $this->_get_property('preset');

		if (!isset($preset)) {
			$preset = 'default';
		}
		
		$preset_props = Upfront_Text_Presets_Server::get_instance()->get_preset_properties($preset);

		$matches = array();

		if ( preg_match('/<div class="plaintxt_padding([^>]*)>/s', $content) ){
			$doc = new DOMDocument();
			$clean_doc = new DOMDocument();
			$content = "<head><meta http-equiv='Content-type' content='text/html; charset=UTF-8' /></head><body>{$content}</body>";
			$doc->loadHTML($content);
			$divs = $doc->getElementsByTagName('div');
			$plaintxt_wrap = false;
			foreach ( $divs as $div ){
				if ( !$div->hasAttributes() )
					continue;
				$class = $div->attributes->getNamedItem('class');
				if ( !is_null($class) && !empty($class->nodeValue) && strpos($class->nodeValue, 'plaintxt_padding') !== false ) {
					$plaintxt_wrap = $div;
					break;
				}
			}
			if ( $plaintxt_wrap !== false && $plaintxt_wrap->hasChildNodes() ) {
				foreach ( $plaintxt_wrap->childNodes as $node ){
					$import_node = $clean_doc->importNode($node, true);
					$clean_doc->appendChild($import_node);
				}
			}
			$content = $clean_doc->saveHTML();
		}

		$content = $this->_decorate_content($content);

		// Render old appearance
		if ($this->_get_property('usingNewAppearance') === false) {
			$style = array();
			if ($this->_get_property('background_color') && '' != $this->_get_property('background_color')) {
				$style[] = 'background-color: '. Upfront_UFC::init()->process_colors($this->_get_property('background_color'));
			}

			if ($this->_get_property('border') && '' != $this->_get_property('border')) {
				$style[] = 'border: '.Upfront_UFC::init()->process_colors($this->_get_property('border'));
			}

			return (sizeof($style)>0 ? "<div class='plaintxt_padding' style='".implode(';', $style)."'>": ''). $content .(sizeof($style)>0 ? "</div>": '');
		}

		// Render new appearance
		$return_content = "<div class='plain-text-container'>";
		if(isset($preset_props['additional_padding']) && $preset_props['additional_padding'] == "yes") {
			$return_content .= "<div class='plaintxt_padding'>" . $content . "</div>";
		} else {
			$return_content .= $content;
		}
		$return_content .= "</div>";
		
		return $return_content;
	}

	/**
	 * Decorates content according to settings.
	 *
	 * Wraps the most common filters done in `the_content` filter,
	 * without actually making use of it.
	 *
	 * @param string $content Raw content
	 *
	 * @return string Decorated content
	 */
	protected function _decorate_content ($content) {
		if (defined('DOING_AJAX') && DOING_AJAX) return $content;

		$codec = Upfront_Codec::get('wordpress'); 

		// Manually applying the minimum required WP text processing functions
		if ($codec->can_process_shortcodes()) {
			$content = $codec->do_shortcode($content);

			$content = wptexturize($content);
			$content = convert_smilies($content);
			$content = convert_chars($content);

			// Prevent adding excessive p tags since the markup and content is already made 
			// and confirmed in the text el via ueditor
			$content = shortcode_unautop($content);
		}

		return $codec->expand_all($content);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['text_element'])) return $strings;
		$strings['text_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Text', 'upfront'),
			'css' => array(
				'container_label' => __('Text container', 'upfront'),
				'container_info' => __('The layer that contains all the text of the element.', 'upfront'),
				'p_label' => __('Text paragragh', 'upfront'),
				'p_info' => __('The paragragh that contains all the text of the element.', 'upfront'),
			),
			'default_content' => __('<p>My awesome stub content goes here</p>', 'upfront'),
			'dbl_click' => __('Double click to edit text', 'upfront'),
			'appearance' => __('Textbox Appearance', 'upfront'),
			'border' => __('Border', 'upfront'),
			'none' => __('None', 'upfront'),
			'solid' => __('Solid', 'upfront'),
			'dashed' => __('Dashed', 'upfront'),
			'dotted' => __('Dotted', 'upfront'),
			'width' => __('Width', 'upfront'),
			'color' => __('Color', 'upfront'),
			'bg_color' => __('Background Color', 'upfront'),
			'edit_text' => __('Edit Text', 'upfront'),
			'h1' => __('Main Heading (H1)', 'upfront'),
			'h2' => __('Sub Heading (H2)', 'upfront'),
			'h3' => __('Sub Heading (H3)', 'upfront'),
			'h4' => __('Sub Heading (H4)', 'upfront'),
			'h5' => __('Sub Heading (H5)', 'upfront'),
			'h6' => __('Sub Heading (H6)', 'upfront'),
			'p' => __('Paragraph (P)', 'upfront'),
			'a' => __('Anchor Link (A)', 'upfront'),
			'ahover' => __('Anchor Link Hover (A:HOVER)', 'upfront'),
			'ul' => __('Unordered List (UL)', 'upfront'),
			'ol' => __('Ordered List (OL)', 'upfront'),
			'bq' => __('Blockquote (BLOCKQUOTE)', 'upfront'),
			'bqalt' => __('Blockquote Alternative (BLOCKQUOTE)', 'upfront'),
			'settings' => array(
				'colors_label' => __('Colors', 'upfront'),
				'content_area_bg' => __('Content Area BG', 'upfront'),
				'typography_label' => __('Typography', 'upfront'),
				'padding_label' => __('Additional Padding', 'upfront'),
				'tooltip_label' => __('Additional padding is handy when you have a border or BG Color set.', 'upfront')
			)
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
			;
	}

	public static function export_content ($export, $object) {
		return upfront_get_property_value('content', $object);
	}
}
