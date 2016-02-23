<?php

class Upfront_LikeBoxView extends Upfront_Object {

	public function get_markup () {
		$element_size = $this->_get_property('element_size');
		$url = $this->_get_property('facebook_url');


		$hide_cover = is_array($this->_get_property('hide_cover'))?'true':'false';
		$show_friends = is_array($this->_get_property('show_friends'))?'true':'false';
		$small_header = is_array($this->_get_property('small_header'))?'true':'false';
		$show_posts = is_array($this->_get_property('show_posts'))?'true':'false';


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
			$path = explode('/', trim($parts['path'], '/'));
			$fbname = end($path);

			$wide = intval($element_size['width'])-30;

			if($wide > 500)
				$wide=500;


			/*if($wide%53 > 0)
				$wide = intval($wide/53)*53+22;
			else
				$wide = $element_size['width'];
			*/

			return "<iframe src='//www.facebook.com/v2.5/plugins/page.php?adapt_container_width=true&amp;container_width={$wide}&amp;width={$wide}&amp;height=".($element_size['height']-30)."&amp;hide_cover={$hide_cover}&amp;href=https%3A%2F%2Fwww.facebook.com%2F{$fbname}&amp;show_facepile={$show_friends}&amp;show_posts={$show_posts}&amp;small_header={$small_header}' scrolling='no' frameborder='0' style='border:none; display:block; overflow:hidden; margin: auto; width:{$wide}px; height:".($element_size['height']-30)."px;' allowTransparency='true'></iframe>";
			/*return $this->wrap(
				"<iframe src='//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F{$fbname}&amp;width={$wide}&amp;height={$element_size['height']}&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false' scrolling='no' frameborder='0' style='border:none; overflow:hidden; width:{$wide}px; height:{$element_size['height']}px;' allowTransparency='true'></iframe>"
			);*/
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
			'hide_cover' =>array('no'),
			'show_friends' =>array('yes'),
			'small_header' =>array('no'),
			'show_posts' =>array('yes'),
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
			'facebook_account' => __('Facebook Account', 'upfront'),
			'container_info' => __('Facebook box wrapper layer.', 'upfront'),
			'placeholder_guide' => __('Enter your Facebook Page URL:', 'upfront'),
			'placeholder' => __('facebook.com/yourPageName', 'upfront'),
			'ok' => __('Ok', 'upfront'),
			'you_need_to_set_url' => __('You need to set a Facebook URL in your', 'upfront'),
			'global_social_settings' => __('global social settings', 'upfront'),
			'opts' => array(
				'style_label' => __('Layout Style', 'upfront'),
				'style_title' => __('Layout Style settings', 'upfront'),
				'page_url' => __('Your Facebook Page URL', 'upfront'),
				'url_sample' => __('https://www.facebook.com/YourPage', 'upfront'),
				'back_to' => __('Back to your', 'upfront'),
				'global_settings' => __('global settings', 'upfront'),
				'show_friends' => __('Show Friend\'s Faces', 'upfront'),
				'small_header' => __('Use Small Header', 'upfront'),
				'hide_cover' => __('Hide Cover Photo', 'upfront'),
				'show_posts' => __('Show Page Posts', 'upfront'),
			),
			'general_settings' => __('General Settings', 'upfront'),
			'settings' => __('LikeBox settings', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}

