<?php get_header(); ?>

<div id="upfront-title">
	<h3 class="upfront-original"><?php echo $post->post_title; ?></h3>
	<input type="text" style="width:90%" value="<?php esc_attr_e($post->post_title); ?>" />
</div>

<div id="upfront-body">
	<input type="hidden" name="post_id" id="upfront-post_id" value="<?php echo $post->ID; ?>" />
	<div class="upfront-original"><?php echo apply_filters('the_content', $post->post_content); ?></div>
	<textarea style="width:90%" rows="16"><?php echo esc_textarea(apply_filters('the_content', $post->post_content)); ?></textarea>
</div>


<script>
(function ($) {

$(document).on('upfront-load', function () {
Upfront.Application.ContentEditor.run();
})

$(function () {

	var root_selectors = "#upfront-title,#upfront-body",
		$roots = $(root_selectors),
		$editables = $roots.find("input,textarea"),
		$save_actions = $("#upfront-save button"),
		$meta_actions = $("#upfront-meta")
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
});
})(jQuery);
</script>

<style>
#upfront-popup-background {
	position: fixed;
	top: 0;
	left: 0;
	background: #5c6b79;
	opacity: .75;
	z-index: 99998;
}
#upfront-popup {
	position: fixed;
	top: 40px;
	z-index: 99999;
}
#upfront-popup-content {
	background: #e5f3fe;
}

#upfront-popup-close {
	color: #e5f3fe;
	position: absolute;
	font-size: 18px;
	top: 0;
	right: 0;
}

.upfront-popup-placeholder {
	margin: 0;
	line-height: 100px;
	text-align: center;
	font-style: italic;
	color: #999;
}

/* Tabs */
.upfront-popup-meta {
	height: 38px;
}
.upfront-popup-meta .upfront-tabs {
	list-style: none;
	position: absolute;
	top: 0;
	left: 0;
	margin: 0; padding: 0;
}
.upfront-popup-meta .upfront-tabs li {
	display: inline-block;
	width: 200px;
	height: 36px;
	background: #a4b9cb;
	font-size: 18px;
	line-height: 38px;
	text-align: center;
	color: #4e5e6d;
}
.upfront-popup-meta .upfront-tabs li.active {
	background: #e5f3fe;
	border-top: 2px solid #e5f3fe;
}

/* Pagination */
#upfront-entity_list-pagination {
	clear: both;
}
.upfront-pagination_item {
	float: left;
	width: 20px;
	line-height: 20px;
	height: 20px;
	margin: 10px;
	text-align: center;
	font-size: 18px;
	color: #aec4d8;
}
.upfront-pagination_item.current {
	color: #fff;
	border: 2px solid #2ecc90;
}

/* Search */
#upfront-entity_list-search {
	float: right;
}
#upfront-search_action, #upfront-search_container {
	float: right;
	height: 50px;
}
#upfront-search_action {
	line-height: 50px;
	width: 50px;
	background: #394a59;
	color: #cdd6dd;
	font-size: 18px;
	text-align: center;
}
#upfront-search_container input {
	height: 40px;
	border: none;
	line-height: 50px;
	font-size: 18px;
	padding: 5px;
	background: rgba(45,64,81,.75);
	color: #cdd6dd;
}

/* Tax */
#upfront-taxonomy-list, #upfront-taxonomy-add {
	padding: 1em;
	color: #476d8a;
}
#upfront-taxonomy-list {
	max-height: 300px;
	overflow-y: scroll;
}
#upfront-taxonomy-add {
	height: 86px;
	line-height: 86px;
}
.upfront-taxonomy-hierarchical .upfront-taxonomy_item {
	padding-left: 1em;
}
#upfront-taxonomy-add {
	background: #c3dcf1;
}

/* Flat tax */
.upfront-taxonomy-flat #upfront-taxonomy-list {
	padding: 0;
}
.upfront-taxonomy-list-panel {
	float: left;
	width: 46%;
	padding: 2%;
}
.upfront-taxonomy-list-panel h3 {
	font-weight: normal;
}
#upfront-taxonomy-list-all {
	background: #d9edfe;
}
.upfront-taxonomy-flat .upfront-taxonomy_item {
	width: 48%;
	float: left;
}

/* Entities(Posts) list */
#upfront-list {
	display: table;
	width: 100%;
	color: #afc1d0;
}
#upfront-list .upfront-list_item {
	display: table-row;
	background: #f2f9ff;
	padding-top: .5em;
}
#upfront-list .upfront-list_item .upfront-list_item-component {
	padding: 0 1em;
	border-top: 1px solid transparent;
	border-bottom: 1px solid transparent;
}
#upfront-list .upfront-list_item:hover {
	background: #e8f4fe;
}
#upfront-list .upfront-list_item:hover .upfront-list_item-component {
	border-top: 1px solid #a4b9cb;
	border-bottom: 1px solid #a4b9cb;
	color: #7d93a6;
}
#upfront-list .upfront-list_item:nth-child(even) {
	background: #e8f4fe;
}
#upfront-list #upfront-list-meta.upfront-list_item {
	background: #e8f4fe;
	color: #5e6e7b;
}
#upfront-list #upfront-list-meta.upfront-list_item .upfront-list_item-component {
	border-bottom: 1px solid #a4b9cb;
}
#upfront-list #upfront-list-meta.upfront-list_item:hover .upfront-list_item-component {
	border-top: none;
	border-bottom: 1px solid #a4b9cb;
}
#upfront-list-meta .upfront-header.active {
	font-weight: bold;
}
.upfront-list_item-component {
	display: table-cell;
	height: 38px;
	line-height: 38px;
}
.upfront-list_item-component.upfront-date {
	width: 20%;
}
.upfront-list_item-component.upfront-title {
	width: 65%;	
}
.upfront-list_item-component.upfrot-author {
	width: 15%;	
}

/* Pages list */
#upfront-list-page {
	clear: both;
	background: #cfdbe5;
}

#upfront-list-page-path {
	height: 50px;
	line-height: 50px;
	background: #e5f3fe;
	border-bottom: 1px solid #a4b9cb;
	padding-left: 30px;
}
#upfront-list-page-path a {
	color: #2ecc90;
	text-decoration: none;
}
#upfront-list-page-path a.last {
	color: #273a4c;
	font-weight: bold;
}

#upfront-list-page-preview {
	float: left;
	width: 40%;
	background: #cfdbe5;
	border-right: 1px solid #a4b9cb;
	min-height: 350px;
}
#upfront-list-page-preview h3, #upfront-page_preview-wrapper {
	padding-left: 30px;
}

#upfront-list-page-tree {
	margin-left: 40%;
	background: #f2f9ff;
	max-height: 350px;
	min-height: 350px;
	overflow-y: scroll;
}
#upfront-list-page-tree .upfront-list-page_item {
	padding-left: 1em;
	font-weight: normal;
	color: #33475b;
	line-height: 30px;
	border-top: 1px solid #dde7ef;
}
#upfront-list-page-tree .upfront-list-page_item.has_children {
	font-weight: bold;
}
#upfront-list-page-tree .upfront-list-page_item.active {
	background: #33475b;
	color: #2ecc90;
}

/* Comments-specific additions to Entities list */
.upfront-comment-approved {
	display: block;
	position: absolute;
	width: 20px;
	left: -30px;
	height: 38px;
	line-height: 38px;
}

.upfront-list-comments .upfront-list_item-component.upfront-comment_author {
	width: 30%;
}
.upfront-list-comments .upfront-list_item-component.upfront-date {
	width: 15%;
}
.upfront-list-comments .upfront-list_item-component.upfront-comment_content {
	width: 55%;
}
#upfront-list .upfront-list_item-comment .upfront-comment_author {
	color: #2ecc90;
}

.upfront-list-comments .upfront-list_item .upfront-comment_content-full {
	height: 185px;
	overflow-y: scroll;
}
.upfront-list-comments .upfront-list_item .upfront-comment_actions-wrapper {
	position: relative;
	left: -1em;
	top: 85px;
	clear: both;
}
.upfront-list-comments .upfront-list_item .upfront-comment_actions-wrapper a {
	display: block;
	float: left;
	width: 40px;
	height: 40px;
	padding-top: 5px;
	text-align: center;
	background: #314355;
	color: #2ecc90;
	text-decoration: none;
	font-size: 10px;
}
.upfront-list-comments .upfront-list_item .upfront-comment_actions-wrapper a i {
	display: block;
	font-size: 12px;
	height: 6px;
	color: #a4b9cb;
}

.upfront-list_item-comment textarea {
	width: 98%;
}

/* Post single view */

.upfront-post_content-wrapper {
	padding-left: 30px;
	padding-right: 30px;
}

#upfront-back_to_posts {
	display: block;
	float: left;
	font-size: 18px;
	color: #fff;
	text-decoration: none;
	line-height: 24px;
}

</style>
<?php get_footer(); ?>