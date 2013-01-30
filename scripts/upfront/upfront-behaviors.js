(function ($) {

var LayoutEditor = {
	create_mergeable: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
		var app = this,
			models = [],
			region = app.layout.get("regions").active_region
			collection = (region ? region.get("modules") : false)
		;
		if (collection) $(".upfront-region").selectable({
			filter: ".upfront-module",
			stop: function () {
				if ($(".ui-selected").length < 2) return false;
				$(".ui-selected").each(function () {
					var $node = $(this),
						element_id = $node.attr("id"),
						model = collection.get_by_element_id(element_id)
					;
					if (model && model.get && !model.get("name")) models.push(model);
					else $node.removeClass("ui-selected");
				});
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				$(".ui-selected").removeClass("ui-selected").addClass("upfront-active_entity");
				if (!models.length) return false;

				// @TODO: refactor this!
				app.command_view.commands.push(new Upfront.Views.Editor.Command_Merge({"model": _.extend({}, app.layout, {"merge": models})}));
				app.command_view.render();
			}
		});
	},


	destroy_mergeable: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
	},


	create_resizable: function (view, model) {
		$(".ui-resizable").each(function () {
			$(this).resizable("destroy");
		});
		// Don't allow reiszing on non-desktop layouts
		if (!$(Upfront.Settings.LayoutEditor.Selectors.main).is(".desktop")) return false;

		// - Resizable - snap to base grid and replace size with class on release
		var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
			main_width = $main.width() || 210,
			$parent = view.$el,
			parent_width = $parent.width() || 100,
			GRID_SIZE = Upfront.Settings.LayoutEditor.Grid.size,
			BASELINE = Upfront.Settings.LayoutEditor.Grid.baseline,
			$resizable = view.$el.find(">.upfront-editable_entity"),
			grid_selector = _.range(1, GRID_SIZE+1).map(function(i){ return '.'+Upfront.Settings.LayoutEditor.Grid.class+i }).join(',');
		;
		if ($resizable.resizable) $resizable.resizable({
			"containment": "parent",
			/*"grid": [parseInt(main_width/GRID_SIZE, 10), BASELINE],*/ // @TODO this doesn't work well with box-sizing: border-box that we use, disable it for now and might need nicer custom coding grid snapping
			start: function (e, ui) {
				var $el = ui.element,
					classes = view.model.get_property_value_by_name('class');
				// retain width on grid elements, so it remains fixed during resize
				$el.find(grid_selector).each(function(){
					$(this).css({
						'width': parseInt($(this).outerWidth())+'px',
						'margin-left': parseInt($(this).outerWidth(true)-$(this).outerWidth())+'px'
					});
				});
				view.$el.append('<div class="upfront-preview-helper '+classes+'" style="height:'+$el.outerHeight()+'px;"></div>');
			},
			stop: function (e, ui) {
				var $el = ui.element,
					diff = $el.outerWidth() / main_width,
					classNum = parseInt(Math.round((diff > 1 ? 1 : diff) * GRID_SIZE), 10),
					className = Upfront.Settings.LayoutEditor.Grid.class + classNum,
					prop = model.replace_class(className),
					relative_percentage = 100 * (classNum/GRID_SIZE)
				;
				// Make sure CSS is reset, to fix bug when it keeps all resize CSS for some reason
				// @TODO this is temporary hack, we need to somehow retain height and snap it to baseline
				$el.css({
					'width': '',
					'height': '',
					'position': '',
					'top': '',
					'left': ''
				});
				view.trigger("upfront:entity:resize", classNum, relative_percentage);
				// remove width on stop
				$el.find(grid_selector).css({
					'width': '',
					'margin-left': ''
				});
				view.$el.find('.upfront-preview-helper').remove();
			},
			resize: function (e, ui) {
				// Hack for better resize behavior
				var $el = ui.element,
					$preview = view.$el.find('.upfront-preview-helper'),
					diff = ui.size.width / main_width,
					classNum = parseInt(Math.round((diff > 1 ? 1 : diff) * GRID_SIZE), 10),
					className = Upfront.Settings.LayoutEditor.Grid.class + classNum,
					replace_rx = new RegExp(Upfront.Settings.LayoutEditor.Grid.class+'\\d+');
				$el.height((ui.size.height > 5 ? ui.size.height : 0) || ui.originalSize.height)
					.width(ui.size.width > parent_width ? parent_width : ui.size.width);
				$preview.height($el.outerHeight()).attr('class', $preview.attr('class').replace(replace_rx, className));
			}
		});
	},


	create_sortable: function (view, model) {
		//$(".ui-draggable").draggable("destroy"); // Draggables destroying in this way breaks Chrome
		// Don't allow sorting on non-desktop layouts
		if (!$(Upfront.Settings.LayoutEditor.Selectors.main).is(".desktop")) return false;

		var $containment = view.$el.find(".upfront-editable_entity:first").is(".upfront-object") ? view.$el.parents(".upfront-editable_entities_container:first") : view.$el.parents(".upfront-region:first"),
			$draggable = view.$el.find(">.upfront-editable_entity"),
			$target = view.$el.find(">.upfront-editable_entity:first"),
			margin_left_class = Upfront.Settings.LayoutEditor.Grid.left_margin_class,
			margin_right_class = Upfront.Settings.LayoutEditor.Grid.right_margin_class,
			width_class = Upfront.Settings.LayoutEditor.Grid.class
			tmp = view.$el.append("<div id='upfront-temp-measurement' class='" + margin_left_class + "1 " + width_class + "1' />"),
			$measure = $("#upfront-temp-measurement"),
			margin_increment = parseFloat($("#upfront-temp-measurement").css("margin-left"), 10),
			margin_left_rx = new RegExp('\\b' + margin_left_class + '(\\d)+'),
			margin_right_rx = new RegExp('\\b' + margin_right_class + '(\\d)+'),
			GRID_SIZE = Upfront.Settings.LayoutEditor.Grid.size
		;
		$measure.remove();

		if ($draggable.draggable) $draggable.draggable({
			//containment: $containment,
			revert: true,
			revertDuration: 1,
			zIndex: 100,
			helper: 'clone',
			start: function (e, ui) {
				var 
					$el = view.$el,
					$me = $el.find(">.upfront-editable_entity:first"),
					height = $me.outerHeight(),
					width = $me.outerWidth(),
					classes = view.model.get_property_value_by_name('class'),
					
					current_margin_left = $me.attr("class").match(margin_left_rx),
					current_margin_left_size = current_margin_left && current_margin_left.length ? parseInt(current_margin_left[1], 10) : 0,
		
					current_margin_right = $me.attr("class").match(margin_right_rx),
					current_margin_right_size = current_margin_right && current_margin_right.length ? parseInt(current_margin_right[1], 10) : 0
				;
				$me	.data('margin-left', current_margin_left_size)
					.data('margin-right', current_margin_right_size)
					.data('margin-class', '');
				$me.hide();
				$el.append('<div class="upfront-preview-helper '+classes+'" style="height:'+height+'px;"></div>');
			},
			drag: function (e, ui) {
				// Set up collection position
				var 
					$el = view.$el,
					$me = $el.find(">.upfront-editable_entity:first"),
					$helper = $el.find(">.ui-draggable-dragging"),
					$preview = $el.find(">.upfront-preview-helper");
					$prevs = $el.prevAll(),
					$nexts = $el.nextAll(),
					
					height = $me.outerHeight(),
					width = $me.outerWidth(),

					original_left = ui.originalPosition.left,
					original_top = ui.originalPosition.top,
					ui_left = ui.position.left,
					ui_top = ui.position.top,

					relative_left = original_left - ui_left,
					relative_top = original_top - ui_top,

					current_offset = $helper.offset(),
					current_left = current_offset.left,
					current_top = current_offset.top,
					current_bottom = current_top+height,
					current_right = current_left+width,
					
					current_margin_left_size = $me.data('margin-left'),
					current_margin_right_size = $me.data('margin-right'),
					
					margin_pfx = (relative_left > 0 ? 
						($me.attr("class").match(margin_right_rx) ? margin_right_class : margin_left_class) // Left 
						: 
						($me.attr("class").match(margin_left_rx) ? margin_left_class : ($target.attr("class").match(margin_left_rx) ? margin_right_class : margin_left_class)) // Right 
					),

					relative_margin_size = -1 * (relative_left ? Math.floor(relative_left / margin_increment) : 0),
					margin_size = margin_right_class == margin_pfx
						? current_margin_right_size + relative_margin_size
						: current_margin_left_size + relative_margin_size,
					
					replace_rx = new RegExp(margin_pfx+'\\d+');	

					resort = false
				;
				$preview.attr('class', $preview.attr('class').replace(replace_rx, margin_pfx + Math.abs(margin_size)));
				$me	.data( margin_right_class == margin_pfx ? 'margin-left' : 'margin-right', Math.abs(margin_size))
					.data('margin-class', margin_pfx + Math.abs(margin_size));
				
				$el.find(".upfront-debug-info").text('current offset: '+current_left+','+current_top+','+current_right+','+current_bottom+' | relative offset: '+relative_left+','+relative_top+' | class: '+$me.data('margin-class'));
				if ($prevs.length) $prevs.each(function () {
					var $prev = $(this)
						$child = $prev.find(">.upfront-editable_entity")
						pos = $child.offset(),
						width = $child.outerWidth()
					;
					if (pos.left > current_left) {
						if (pos.top > current_top) {
							$prev.before($el);
							$el.addClass("upfront-replaced").position({top: 0, left: 0})
							resort = true;
						}
					}
					$prev.find(".upfront-debug-info").text('current offset: '+pos.left+','+pos.top+' | width: '+width);
				});
				if ($nexts.length) $nexts.each(function () {
					var $next = $(this)
						$child = $next.find(">.upfront-editable_entity")
						pos = $child.offset(),
						width = $child.outerWidth()
					;
					if (current_left > (pos.left + width)) {
						if (current_top > pos.top) {
							$next.after($el);
							$el.addClass("upfront-replaced").position({top: 0, left: 0})
							resort = true;
						}
					}
					$next.find(".upfront-debug-info").text('current offset: '+pos.left+','+pos.top+' | width: '+width);
				});
				if (resort) {
					view.resort_bound_collection();
					//$draggable.css({"destroy"});
				}
				//return !resort;

			},
			stop: function (e, ui) {
				// Set up margins
				if (view.$el.is(".upfront-replaced")) {
					view.$el.removeClass("upfront-replaced");
					view.model.replace_class("ml0");
					return true;
				}
				var 
					$target = view.$el.find(">.upfront-editable_entity:first"),
					
					original_left = ui.originalPosition.left,
					original_top = ui.originalPosition.top,
					current_left = ui.position.left,
					current_top = ui.position.top,

					relative_left = original_left - current_left,
					relative_top = original_top - current_top
				;
				view.$el.find('.upfront-preview-helper').remove();
				view.model.replace_class($target.data('margin-class'));
				$target.show();
				//console.log(margin_increment)
				//console.log([current_margin_left_size, margin_size]);
				//console.log([relative_left, margin_pfx + margin_size])
				
				//view.resort_bound_collection();
			}
		});
	},


	create_undo: function () {
		this.layout.store_undo_state();
	},
	apply_history_change: function () {
		this.layout_view.render();
	}
};

define({
	"Behaviors": {
		"LayoutEditor": LayoutEditor
	}
});
})(jQuery);