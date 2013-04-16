<?php get_header(); ?>

<div id="upfront-title">
	<h3 class="upfront-original"><?php echo $post->post_title; ?></h3>
	<input type="text" style="width:90%" value="<?php esc_attr_e($post->post_title); ?>" />
</div>

<div id="upfront-body">
	<div class="upfront-original"><?php echo apply_filters('the_content', $post->post_content); ?></div>
	<textarea style="width:90%" rows="16"><?php echo esc_textarea(apply_filters('the_content', $post->post_content)); ?></textarea>
</div>

<div id="upfront-save">
	<button type="button" id="upfront-publish">Publish</button>
	<button type="button" id="upfront-draft">Draft</button>
	<a id="upfront-preview" <?php echo ('publish' == $post->post_status ? '' : 'style="display:none"'); ?> href="<?php echo get_permalink($post->ID); ?>">Visit</a>
</div>

<?php
global $wp_meta_boxes;

function add_meta_box( $id, $title, $callback, $screen = null, $context = 'advanced', $priority = 'default', $callback_args = null ) {
	global $wp_meta_boxes;

	$page = $screen;

	if ( !isset($wp_meta_boxes) )
		$wp_meta_boxes = array();
	if ( !isset($wp_meta_boxes[$page]) )
		$wp_meta_boxes[$page] = array();
	if ( !isset($wp_meta_boxes[$page][$context]) )
		$wp_meta_boxes[$page][$context] = array();

	foreach ( array_keys($wp_meta_boxes[$page]) as $a_context ) {
		foreach ( array('high', 'core', 'default', 'low') as $a_priority ) {
			if ( !isset($wp_meta_boxes[$page][$a_context][$a_priority][$id]) )
				continue;

			// If a core box was previously added or removed by a plugin, don't add.
			if ( 'core' == $priority ) {
				// If core box previously deleted, don't add
				if ( false === $wp_meta_boxes[$page][$a_context][$a_priority][$id] )
					return;
				// If box was added with default priority, give it core priority to maintain sort order
				if ( 'default' == $a_priority ) {
					$wp_meta_boxes[$page][$a_context]['core'][$id] = $wp_meta_boxes[$page][$a_context]['default'][$id];
					unset($wp_meta_boxes[$page][$a_context]['default'][$id]);
				}
				return;
			}
			// If no priority given and id already present, use existing priority
			if ( empty($priority) ) {
				$priority = $a_priority;
			// else if we're adding to the sorted priority, we don't know the title or callback. Grab them from the previously added context/priority.
			} elseif ( 'sorted' == $priority ) {
				$title = $wp_meta_boxes[$page][$a_context][$a_priority][$id]['title'];
				$callback = $wp_meta_boxes[$page][$a_context][$a_priority][$id]['callback'];
				$callback_args = $wp_meta_boxes[$page][$a_context][$a_priority][$id]['args'];
			}
			// An id can be in only one priority and one context
			if ( $priority != $a_priority || $context != $a_context )
				unset($wp_meta_boxes[$page][$a_context][$a_priority][$id]);
		}
	}

	if ( empty($priority) )
		$priority = 'low';

	if ( !isset($wp_meta_boxes[$page][$context][$priority]) )
		$wp_meta_boxes[$page][$context][$priority] = array();

	$wp_meta_boxes[$page][$context][$priority][$id] = array('id' => $id, 'title' => $title, 'callback' => $callback, 'args' => $callback_args);
}

function get_current_screen () {
	$current_screen = new StdClass;
	$current_screen->id = 'tmp';//'incsub_event';
	return $current_screen;
}
do_action('admin_enqueue_scripts');
do_action('admin_print_styles');


$screen_page = $post->post_type;//'incsub_event';
do_action('add_meta_boxes');
do_action('add_meta_boxes_' . $screen_page);

$contexts = array('normal', 'advanced', 'side');
$priorities = array('high', 'sorted', 'core', 'default', 'low');
if (isset($wp_meta_boxes) && isset($wp_meta_boxes[$screen_page])) foreach ($contexts as $context) {
	echo '<div class="upfront-meta_context upfront-meta_context-' . $context . '">';
	foreach ($priorities as $priority) {
		if (empty($wp_meta_boxes[$screen_page][$context][$priority])) continue;
		$boxes = $wp_meta_boxes[$screen_page][$context][$priority];
		foreach ($boxes as $box) {
			$title = $box['title'];
			echo '<div id="' . esc_attr($box['id']) . '" class="upfront-metabox">' . 
				'<h3>' . $title . '</h3>' .
			'';
			echo call_user_func_array($box['callback'], array($box['args']));
			echo '</div><hr />';
		}
	}
	echo '</div>';
}
// && isset($wp_meta_boxes[$page][$context]))

?>
<style>
.upfront-meta_context {
	width: 90%;
	clear: both;
} 
.upfront-meta_context .upfront-metabox {
	width: 90%;
}
.upfront-meta_context-side .upfront-metabox {
	width: 30%;
}
.upfront-editable_trigger {
	display: none;
}
</style>
<script>
(function ($) {

$(function () {
	var root_selectors = "#upfront-title,#upfront-body",
		$roots = $(root_selectors),
		$editables = $roots.find("input,textarea"),
		$actions = $("#upfront-save button")
	;
	$editables.hide();

	$roots.on("click", function () {
		var $root = $(this),
			$original = $root.find(".upfront-original"),
			$editable = $root.find("input,textarea")
		;
		if ($original.is(":visible")) {
			$original.hide();
			$editable.show().focus();
		}
	});
	$editables.on("blur", function () {
		var $editable = $(this),
			$root = $editable.parents(root_selectors),
			$original = $root.find(".upfront-original")
		;
		if (!$original.is(":visible")) {
			$editable.hide();
			$original.html($editable.val()).show();
		}
	});

	$actions.on("click", function () {
		var $me = $(this),
			is_published = !!$me.is("#upfront-publish"),
			action = (is_published ? "publish" : "draft"),
			data = {
				"action": "upfront-edit-" + action,
				"id": "<?php echo $post->ID; ?>",
				"title": $("#upfront-title input").val(),
				"body": $("#upfront-body textarea").val()
			}
		;
		$.post(Upfront.Settings.ajax_url, data, function (data) {
			if (data && data.data && data.data.ID) {
				$("#upfront-preview").attr("href", data.data.permalink);
				if (is_published) $("#upfront-preview").show();
				return true;
			}
			alert("Post saving failed!");
		});
	});
	
});
})(jQuery);
</script>
<?php get_footer(); ?>