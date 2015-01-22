<?php

class Upfront_LikeBoxView extends Upfront_Object {

	public function get_markup () {
		$element_size = $this->_get_property('element_size');
		$url = $this->_get_property('facebook_url');
		$global_settings = Upfront_SocialMedia_Setting::get_globals();

		if($url=='' && $global_settings){
			$services = $global_settings['services'];
			$url = false;

			foreach($services as $s){
				if($s->id == 'facebook')
					$url = $s->url;
			}

			if(!$url)
				return $this->wrap(self::_get_l10n('url_nag'));
		}
		if($url) {
			$parts = parse_url($url);
			$fbname = end(explode('/', trim($parts['path'], '/')));

			return $this->wrap(
				"<iframe src='//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F{$fbname}&amp;width={$element_size['width']}&amp;height={$element_size['height']}&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false' scrolling='no' frameborder='0' style='border:none; overflow:hidden; height:{$element_size['height']}px;' allowTransparency='true'></iframe>"
			);
		}
		else{
			return $this->wrap(self::_get_l10n('url_nag'));
		}
	}

	protected function wrap($content){
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "<div class=' upfront-like-box ' {$element_id}>" . $content . "</div>";

	}

	// Inject style dependencies
	public static function add_public_style () {
		upfront_add_element_style('upfront-like-box', array('css/upfront-like-box-style.css', dirname(__FILE__)));
	}
	public static function add_js_defaults($data){
		$data['ulikebox'] = array(
			'defaults' => self::default_properties(),
		);
		return $data;
	}

	public static function default_properties(){
		return array(
			'id_slug' => 'Like-box-object',
			'type' => "LikeBox",
			'view_class' => "LikeBoxView",
			"class" => "c24 upfront-like-box",
			'has_settings' => 1,
			'element_size' => array(
				'width' => 278,
				'height' => 270
			)
		);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['like_box_element'])) return $strings;
		$strings['like_box_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Like Box', 'upfront'),
			'url_nag' => __('You need to set a Facebook URL in your global social settings.', 'upfront'),
			'container_label' => __('Container', 'upfront'),
			'container_info' => __('Facebook box wrapper layer.', 'upfront'),
			'you_need_to_set_url' => __('You need to set a Facebook URL in your', 'upfront'),
			'global_social_settings' => __('global social settings', 'upfront'),
			'opts' => array(
				'style_label' => __('Layout Style', 'upfront'),
				'style_title' => __('Layout Style settings', 'upfront'),
				'page_url' => __('Your Facebook Page URL', 'upfront'),
				'url_sample' => __('https://www.facebook.com/YourPage', 'upfront'),
				'back_to' => __('Back to your', 'upfront'),
				'global_settings' => __('global settings', 'upfront'),
			),
			'settings' => __('LikeBox settings', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}

