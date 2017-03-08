(function ($) {

define([], function() {
	var PluginsLayouts = function(plugins_layouts) {
		var plugins = [];
		var plugin_body_classes = [];

		function init() {
			_.each(plugins_layouts, function(data, id) {
				var p = new Plugin(id, data);
				plugins.push(p);
				add_body_classes(p.get_body_classes());
			});
		}

		function add_body_classes(classes) {
			plugin_body_classes = _.union(plugin_body_classes, classes);
		}

		/**
		 * @params {mixed} postId - id of current post, can be number or string
		 * @return {Object} - plugin data about current layout, undefined if none
		 */
		this.is_plugin_layout = function(post_id) {
			var current_layout = Upfront.Application.current_subapplication.get_layout_data().layout;

			post_id = post_id || get_post_id_from_layout(current_layout);

			for (var i = 0; i < plugins.length; i++) {
				layout = plugins[i].get_layout(post_id, current_layout);
				if (layout) return layout;
			}
		};

		this.remove_plugin_body_classes = function() {
			if (plugin_body_classes.length === 0) return;

			$('body').removeClass(plugin_body_classes.join(' '));
		};

		function get_post_id_from_layout(layout) {
			if (is_single_page(layout)) {
				return get_page_number(layout);
			}
		}

		function is_single_page(layout) {
			if (!layout.item || !layout.specificity) {
				return false;
			}

			if (layout.item === 'single-page' && layout.specificity.match('single-page-')) {
				return true;
			}

			return false;
		}

		function get_page_number(layout) {
			var pageNumber = layout.specificity.match(/\d+/);
			if (_.isNull(pageNumber) === false && pageNumber.length === 1) {
				return pageNumber[0];
			}
		}

		init();
	};

	var Plugin = function(id, data) {
		var pages_by_id = [];
		var layouts = [];
		var body_class, plugin_name, sample_contents;

		function init() {
			pages_by_id = data.pagesById;
			layouts = data.layouts;
			body_class = data.bodyclass || false;
			plugin_name = data.pluginName;
			sample_contents = data.sampleContents;
		}

		this.get_body_classes = function() {
			var result = [];

			if (body_class) result.push(body_class);

			_.each(pages_by_id, function(page) {
				if (page.bodyclass) result.push(page.bodyclass);
			});

			_.each(layouts, function(layout) {
				if (layout.bodyclass) result.push(layout.bodyclass);
			});

			return result;
		}

		this.get_layout = function(post_id, current_layout) {
			var layout;
			if (post_id && pages_by_id.length) {
				layout = get_layout_by_id(post_id);
			}

			layout = layout || get_layout_by_cascade(current_layout);

			return generate_data(layout);
		}

		function get_layout_by_id(post_id) {
			var page;
			for (var i = 0; i < pages_by_id.length; i++) {
				page = pages_by_id[i];
				if (parseInt(page.pageId, 10) === parseInt(post_id, 10)) {
					return page;
				}
			}
		}

		function get_layout_by_cascade(layout) {
			for (i = 0; i < layouts.length; i++) {
				if ( layouts_match(layouts[i], layout) ) {
					return layouts[i];
				}
			}
		}

		function layouts_match(l1, l2) {
			if (l1.specificity && l2.specificity && l1.specificity === l2.specificity) return true;
			if (l1.item && l2.item && l1.item === l2.item) return true;

			return false;
		}

		function generate_data(layout) {
			if (!layout) return;

			var bc = layout.bodyclass || body_class;
			return {
				pluginName: plugin_name,
				content: sample_contents[layout.content] ? sample_contents[layout.content] : '',
				title: layout.title ? layout.title : '',
				killPostSettings: layout.killPostSettings || false,
				bodyclass: bc || false,
				l10n: layout.l10n || false,
				forbid_save_as: !!layout.forbid_save_as || false
			};
		}

		init();
	};


	var pluginsLayouts = new PluginsLayouts(Upfront.mainData.pluginsLayouts);

	return pluginsLayouts;
});

})(jQuery);
