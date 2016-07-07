<?php

/**
 * Codec factory
 * Used for dispatching proper codec implementation.
 */
abstract class Upfront_Codec {

	const FALLBACK = 'general';

	private static $_codecs = array();

	/**
	 * Factory method.
	 * Looks for the requested implementation and,
	 * if needed, instantiates it before returning the object.
	 *
	 * @param string $instance Codec instance to reach
	 *
	 * @return object Corresponding implementation
	 */
	public static function get ($instance=false) {
		$cname = self::_resolve_class_name($instance);
		if (!empty(self::$_codecs[$cname])) return self::$_codecs[$cname];
		
		$obj = new $cname;
		self::$_codecs[$cname] = $obj;
		return $obj;
	}

	/**
	 * Resolve the requested instance name to a known codec class.
	 * Falls back to general (Upfront_MacroCodec_General) if the class is unknown.
	 *
	 * @param string $name Requested instance suffix
	 *
	 * @return string Class name ready for instantiation.
	 */
	private static function _resolve_class_name ($name) {
		$cname = 'Upfront_MacroCodec_' . ucfirst(strtolower($name));
		if (!class_exists($cname)) return self::_resolve_class_name(self::FALLBACK);
		return $cname;
	}
}

/**
 * Standardized macro expansion hub.
 */
abstract class Upfront_MacroCodec {
	const OPEN = '{{';
	const CLOSE = '}}';
	const FALLBACK = '||';

	protected $_open;
	protected $_close;
	protected $_fallback;

	/**
	 * Returns opening macro delimiter, unescaped.
	 * @return string Opening macro delimiter
	 */
	public function open () {
		return !empty($this->_open)
			? $this->_open
			: self::OPEN
		;
	}

	/**
	 * Returns closing macro delimiter, unescaped.
	 * @return string Closing macro delimiter
	 */
	public function close () {
		return !empty($this->_close)
			? $this->_close
			: self::CLOSE
		;
	}

	/**
	 * Returns fallback macro delimiter, unescaped.
	 * @return string Closing macro delimiter
	 */
	public function fallback () {
		return !empty($this->_fallback)
			? $this->_fallback
			: self::FALLBACK
		;
	}

	/**
	 * Get full, yet unescaped macro form in its simplest incarnation (just the tag)
	 * @param  string $part String part of the macro (macro name)
	 * @return string Final macro
	 */
	public function get_clean_macro ($part) {
		return $this->open() . $part . $this->close();
	}

	/**
	 * Get full, yet unescaped macro form, for whatever reason
	 * @param  string $part String part of the macro (macro name)
	 * @return string Final macro
	 */
	public function get_macro ($part) {
		$fallback = $this->fallback() . '(.*)';
		return $this->open() . $part . $fallback . $this->close();
	}

	/**
	 * Returns compiled, preg_escape'd macro regex in its simplest incarnation (just the tag)
	 * @param  string $part String part of the macro (macro name)
	 * @return string Final macro regex
	 */
	public function get_clean_regex ($part) {
		return '/' . preg_quote($this->get_clean_macro($part), '/') . '/';
	}

	/**
	 * Returns compiled, preg_escape'd macro regex in its full incarnation (fallback included)
	 * @param  string $part String part of the macro (macro name)
	 * @return string Final macro regex
	 */
	public function get_regex ($part) {
		return '/' . 
			preg_quote($this->open(), '/') .
				preg_quote($part, '/') .
				'(' .
					preg_quote($this->fallback(), '/') .
					'(.*?)' .
				')?' .
			preg_quote($this->close(), '/') .
		'/';
	}

	/**
	 * Catch-all macro regex building
	 * @param  bool $capturing Optional argument for including macro name parens in regex, defaults to true
	 * @return string Final regex
	 */
	public function get_catchall_regex ($capturing=true) {
		$rx = '.*';
		if (!empty($capturing)) $rx = "({$rx})";

		return '/' .
			preg_quote($this->open(), '/') .
			$rx .
			preg_quote($this->close(), '/') .
		'/';
	}

	/**
	 * Extract all the macro tags from a string
	 * @param  string $content String to check
	 * @return array Collected macro tags
	 */
	public function get_tags ($content) {
		$tags = $matches = array();
		if (empty($content)) return $tags;

		preg_match_all($this->get_catchall_regex(), $content, $matches);
		if (!empty($matches[1])) $tags = $matches[1];

		if (!empty($tags)) foreach ($tags as $idx => $tag) {
			$tmp = explode($this->fallback(), $tag);
			$clean = reset($tmp);
			if ($clean === $tag) continue;
			$tags[$idx] = $clean;
		}

		return $tags;
	}

	/**
	 * Generic single macro expansion method
	 * @param  string $content Content to act on
	 * @param  string $tag Raw macro tag (name) to work with
	 * @param  string $value Value to replace macro with
	 * @return string Compiled content
	 */
	public function expand ($content, $tag, $value) {
		if (empty($content)) return $content;
		if (empty($tag)) return $content;

		// At this point, `$value` must *not* contain back-references
		$value = preg_replace('/\$/', '\\\$', $value); // Fixes: https://app.asana.com/0/11140166463836/79939381554738

		$macro = $this->get_regex($tag);
		if (empty($value)) {
			$value = '$2'; // Use fallback in replacement if value is empty
		}
		return preg_replace($macro, $value, $content);
	}

	/**
	 * Clear all macros from a piece of string
	 * @param  string $content String to clear
	 * @param  string $clear Optional clearing replacement string, defaults to empty string
	 * @return string Cleared content
	 */
	public function clear_all ($content, $clear='') {
		if (empty($content)) return $content;

		$rx = $this->get_catchall_regex(false); // Force non-capturing version
		return preg_replace($rx, $clear, $content);
	}
}



abstract class Upfront_ScopedExpansionMacroCodec extends Upfront_MacroCodec {
	/**
	 * Interface for one-run macro expansion.
	 *
	 * @param string $content Content to inspect and expand into
	 * @param mixed $context Implementation-specific context (optional)
	 *
	 * @return string Expanded content
	 */
	abstract public function expand_all ($content, $context);
}



abstract class Upfront_SimpleExpansionMacroCodec extends Upfront_MacroCodec {
	/**
	 * Interface for one-run macro expansion.
	 *
	 * @param string $content Content to inspect and expand into
	 *
	 * @return string Expanded content
	 */
	abstract public function expand_all ($content);
}



/**
 * General macro implementation.
 * Used for known tags simple expansion.
 */
class Upfront_MacroCodec_General extends Upfront_MacroCodec {}



/**
 * Postmeta codec implementation.
 */
class Upfront_MacroCodec_Postmeta extends Upfront_ScopedExpansionMacroCodec {

	/**
	 * Expand known postmeta macros in the content
	 *
	 * Very literal, it will treat all the macros as postmeta macros.
	 *
	 * @param  string $content Content to expand macros in
	 * @param  mixed $post Post to fetch metas for
	 * @return string Expanded content
	 */
	public function expand_all ($content, $post) {
		if (empty($content)) return $content;
		if (empty($post)) return $content;

		$tags = $this->get_tags($content);
		if (empty($tags)) return $content;

		$post_id = false;
		if (!is_object($post) && is_numeric($post)) {
			$post_id = $post;
			$post = get_post($post_id);
		} else {
			$post_id = !empty($post->ID) ? $post->ID : false;
		}

		$metadata = Upfront_PostmetaModel::get_post_meta_fields($post_id, $tags);

		foreach ($metadata as $item) {
			if (empty($item['meta_key'])) continue;

			$key = $item['meta_key'];
			$value = $this->get_extracted_value($item, $post_id);

			$content = $this->expand($content, $key, $value);
		}

		// Re-iterate through tags and null out empty replacement macros.
		foreach ($tags as $tag) {
			$content = $this->expand($content, $tag, '');
		}

		return $content;
	}

	/**
	 * Extract and filter value part separately
	 * @param  array $item Meta entry hash
	 * @param  int $post_id Post ID, used for filtering
	 * @return string Extracted and filtered value
	 */
	public function get_extracted_value ($item, $post_id) {
		$key = $item['meta_key'];
		$value = isset($item['meta_value']) ? $item['meta_value'] : '';
		$value = apply_filters('upfront-postmeta-value',
			apply_filters("upfront-postmeta-{$key}-value", $value, $post_id),
			$value, $post_id, $key
		);
		return $value;
	}
}


/**
 * General WP info macros codec
 * Expands to general info stuff.
 */
class Upfront_MacroCodec_Wordpress extends Upfront_SimpleExpansionMacroCodec {

	/**
	 * Set up specific macro opening tags.
	 * Example: `{{wp:site_name}}`, `{{wp:site_description}}`
	 */
	public function __construct () {
		$this->_open = self::OPEN . 'wp:';
	}

	public function expand_all ($content) {
		$macros = $this->get_macros();
		if (empty($macros)) return $content;

		foreach ($macros as $tag => $value) {
			$content = $this->expand($content, $tag, $value);
		}

		return $content;
	}

	/**
	 * Get known WP macros.
	 *
	 * @return array Known macros as tag=>value hash
	 */
	public function get_macros () {
		return array(
			'site_name' => get_bloginfo('name', 'display'),
			'site_description' => get_bloginfo('description', 'display'),
		);
	}
}


/**
 * Upfront-specific layout vars macro codec
 * Expands variables used in exporter layouts.
 */
class Upfront_MacroCodec_Layout extends Upfront_SimpleExpansionMacroCodec {

	/**
		 * Set up specific macro opening tags.
		 * Example: `{{upfront:style_uri}}`, `{{upfront:home_url}}`
		 */
		public function __construct () {
			$this->_open = self::OPEN . 'upfront:';
		}

		public function expand_all ($content) {
			if (empty($content)) return $content;

			$macros = $this->get_macros();
			if (empty($macros)) return $content;
			
			foreach ($macros as $tag => $value) {
				$content = $this->expand($content, $tag, $value);
			}

			return $content;
		}

		/**
		 * Get known Upfront layout macros.
		 *
		 * @return array Known macros as tag=>value hash
		 */
		public function get_macros () {
			return array(
				'style_url' => get_stylesheet_directory_uri(),
				'home_url' => get_home_url(),
				'site_url' => get_site_url(),
			);
		}

		/**
		 * Encodes the expanded variables into their macro representations
		 *
		 * @param string $content Content to process
		 *
		 * @return string Content with macros instead of values
		 */
		public function encode_all ($content) {
			$macros = $this->get_macros();
			if (empty($macros)) return $content;

			foreach ($macros as $tag => $value) {
				$value = preg_quote($value, '/');
				$tag = $this->get_clean_macro($tag);
				$content = preg_replace("/{$value}/", $tag, $content);
			}

			return $content;
		}
}


/**
 * Special-case data macro implementation
 * Pretty much the same as Upfront_MacroCodec_Layout,
 * _except_ that it accepts a data object for `expand_all` and
 * works off that.
 */
class Upfront_MacroCodec_LayoutData extends Upfront_MacroCodec_Layout {

	/**
	 * Overridden expansion interface
	 *
	 * Accept a data map (raw layout) and serialize it as JSON 
	 * so we deal with simple string before processing.
	 *
	 * @param array $data Raw layout as data hash
	 *
	 * @return array Processed layout
	 */
	public function expand_all ($data) {
		if (empty($data)) return $data;

		$content = parent::expand_all(json_encode($data));		
		$data = json_decode($content, true);

		return $data;
	}	
}