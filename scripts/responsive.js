(function($){
	$.fn.responsiveElement = function(){
		return this.each(function(){
			var r_id = 'responsive-'+(Math.floor(Math.random()*100000)),
				bind = $(this).attr('data-bind'),
				min_width = normalize_size($(this).attr('data-min-width')),
				max_width = normalize_size($(this).attr('data-max-width')),
				min_height = normalize_size($(this).attr('data-min-height')),
				max_height = normalize_size($(this).attr('data-max-height')),
				styles = $(this).html(),
				applied_styles = {},
				lazyApplyBinding;

			lazyApplyBinding = _.throttle(function(e){
				if ( e.target == this )
					apply_binding_all();
				else
					apply_binding($(e.target), true);
			}, 100);

			$(window).on('load', apply_binding_all);
			$(window).on('resize', lazyApplyBinding);
			$(document).on('upfront-load', function(){
				if ( typeof Upfront.Events != 'undefined' ){
					Upfront.Events.on("layout:after_render", function(){
						apply_binding_all();
					});
					Upfront.Events.on("entity:module:after_render", apply_binding_view);
					Upfront.Events.on("entity:region:after_render", apply_binding_view);
					Upfront.Events.on("entity:resize_stop", apply_binding_container);
					Upfront.Events.on("entity:drag_stop", apply_binding_container);
					Upfront.Events.on("upfront:wrappers:after_fix_height", apply_binding_view);
					Upfront.Events.on("entity:region_container:resize_stop", apply_binding_view);
					Upfront.Events.on("upfront:editor:image_on", function(sel){
						apply_binding_all();
					});
					Upfront.Events.on("upfront:editor:image_align", function(sel, align){
						apply_binding_all();
					});
				}
			});
			function apply_binding_all (sel) {
				var $sel = _.isString(sel) ? $(sel) :  $('body');
				return apply_binding($sel);
			}
			function apply_binding_view (view) {
				return apply_binding(view.$el.parent());
			}
			function apply_binding_container (view) {
				return apply_binding(view.$el.closest('.upfront-editable_entities_container'));
			}
			function apply_binding ($sel, single) {
				var $style = $('#'+r_id);
				$sel.find(bind).each(function(){
					var $el = single ? $(this).closest('.upfront-module') : $(this)
						id = $(this).attr('id') || 'bind-'+(Math.floor(Math.random()*100000)),
						width = $el.outerWidth(),
						height = $el.outerHeight(),
						bind_styles = styles.replace(/\( ?this ?\)/igm, '#'+id);
					if ( ! $(this).attr('id') )
						$(this).attr('id', id);
					var matched = (
						( (min_width && width >= min_width) || !min_width ) &&
						( (max_width && width <= max_width) || !max_width ) &&
						( (min_height && height >= min_height) || !min_height ) &&
						( (max_height && height <= max_height) || !max_height )
					);
					if ( matched )
						applied_styles[id] = bind_styles;
					else
						applied_styles[id] = '';
				});
				var styles_all = $.map(applied_styles, function(style, id){
					return style;
				});
				if ( !$style.length ){
					$style = $('<style id="' + r_id + '">' + styles_all.join("\n") + '</style>');
					$('body').append($style);
				}
				else {
					$style.html( styles_all.join("\n") );
				}
			}
			function normalize_size (size) {
				if ( typeof size == 'undefined' )
					return false;
				var px_regex = /^(\d+)px$/i,
					col_regex = /^(\d+)col$/i,
					row_regex = /^(\d+)row$/i;
				if ( size.match(px_regex) ) // px
					return size.match(px_regex)[1];
			}
		});
	};

	$('[type="text/responsive_css"]').responsiveElement();

})(jQuery);
