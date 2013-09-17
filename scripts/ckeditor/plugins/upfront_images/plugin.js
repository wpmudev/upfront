(function ($) {

var Plugin = {
	init: function (editor) {
		/*
		editor.addCommand('upfront_images_slider_to_html', Slider.to_html);
		Upfront.Media.Transformations.add(Slider.from_html);
		editor.on('insertHtml', function (e) {
			editor.execCommand("upfront_images_slider_to_html", e);
		});
		*/
		editor.on("focus", function (e) {
			Image.create_dialog();
			Image.bind_events(e.editor.name);
		});
		editor.on("change", function (e) {
			Image.bind_events(e.editor.name);
		});
		editor.on("destroy", function (e) {
			Image.unbind_events(e.editor.name);
			Image.remove_dialog(true, true);
		});
		editor.on("selectionChange", function (e) {
			Image.update_selection(e);
		});
		Upfront.Media.Transformations.add(Image.cleanup);
	}
};

var Image = {
	selector: ".upfront-inserted_image-wrapper",
	bind_events: function (cke) {
		this.instance = cke;
		this.unbind_events();
		$(document)
			.on("mouseenter", this.selector, this, this.hover_on)
			.on("mouseleave", this.selector, this, this.hover_off)
		;
	},
	unbind_events: function (cke) {
		$(document)
			.off("mouseenter", this.selector, this.hover_on)
			.off("mouseleave", this.selector, this.hover_off)
		;
		this.remove_dialog();
	},
	hover_on: function (e) {
		var $me = $(e.target),
			$dialog = $("#upfront-image-details")
		;
		if (!$me.is(e.data.selector)) $me = $me.closest(e.data.selector);
		if (!$me.find('img').length) return;
		
		e.data.show_dialog($me);
		
		Upfront.Events.trigger("upfront:editor:image_on", $me.get());
	},
	hover_off: function (e) {
		var $me = $(e.target);
		//e.data.remove_dialog();
	},
	create_dialog: function () {
		var $dialog = $("<div id='upfront-image-details' class='upfront-ui' />");
		if ( $("#upfront-image-details").length ) return;
		$dialog.append(
			'<div class="upfront-image-orientation">' +
				'<div class="upfront-image-align-left upfront-icon upfront-icon-image-left">left</div>' +
				'<div class="upfront-image-align-center upfront-icon upfront-icon-image-center">center</div>' +
				'<div class="upfront-image-align-right upfront-icon upfront-icon-image-right">right</div>' +
				'<div class="upfront-image-align-full upfront-icon upfront-icon-image-full">full width</div>' +
			'</div>' +
			'<div class="upfront-image-actions">' +
				'<div class="upfront-image-action-change upfront-icon upfront-icon-image-select">Change Image</div>' +
				'<div class="upfront-image-action-details upfront-icon upfront-icon-image-detail">Image Details</div>' +
			'</div>'
		);
		$('body').append($dialog);
		$dialog
			.find(".upfront-image-align-left").on("click", this, this.Align.left).end()
			.find(".upfront-image-align-center").on("click", this, this.Align.center).end()
			.find(".upfront-image-align-right").on("click", this, this.Align.right).end()
			.find(".upfront-image-align-full").on("click", this, this.Align.full).end()

			.find(".upfront-image-action-change").on("click", this, this.change_image).end()
			.find(".upfront-image-action-details").on("click", this, this.Details.toggle).end()
		;
		$dialog.hide();
	},
	remove_dialog: function (force, del) {
		var $dialog = $("#upfront-image-details"),
			$details = $("#upfront-image-details-image_details")
		;
		if (!$details.length){
			$dialog.hide();
		}
		else if (force) {
			$details.remove();
			$dialog.hide();
		}
		if (force && del)
			$dialog.remove();
	},
	show_dialog: function ($wrap) {
		var $dialog = $("#upfront-image-details");
		$dialog.data('ref', $wrap.get(0));
		
		var off = $wrap.offset(),
			height = $wrap.outerHeight(),
			width = $wrap.outerWidth(),
			dialog_height = $dialog.outerHeight();
		
		$dialog.css({
			top: off.top + ( dialog_height > height ? 0 : height-dialog_height ),
			left: off.left,
			width: width
		});
		$dialog.show();
	},
	update_selection: function (e) {
		var editor = e.editor,
			selection = e.data.selection,
			elements = e.data.path.elements,
			last_element = e.data.path.lastElement,
			element;
		_.each(elements, function(el){
			if ( el.hasClass('upfront-inserted_image-wrapper') )
				element = el;
		});
		if ( element ){
			if ( !$(element.$).find('img').length ){
				this.remove_dialog();
				var p = CKEDITOR.dom.element('p');
				element.removeClass('upfront-inserted_image-wrapper');
				element.replace(p);
			}
			else {
				// Modify the selection position if clicked within image and the dialog
				if ( last_element.hasClass('upfront-inserted_image-wrapper') ){
					// This select a editable text inside image paragraph, don't allow and select next element instead
					var range = editor.createRange();
					var next = last_element.getNext();
					if ( !next || !next.is('p') ){
						editor.insertHtml('<p></p>')
						next = last_element.getNext();
					}
					if ( next ){
						range.moveToElementEditablePosition(next);
						editor.getSelection().selectRanges( [range] );
					}
				}
				else if ( !last_element.is('img') ){
					// This select elements within dialog, select the image instead
					function find_child (el, name) {
						for (var i=0; i < el.getChildCount(); i++){
							var child = el.getChild(i);
							if ( child.is && child.is(name) ){
								return child;
							}
						}
						return false;
					}
					var img = find_child(element, 'img');
					if ( !img ){
						var a = find_child(element, 'a');
						if ( a )
							img = find_child(a, 'img');
					}
					if ( img ){
						editor.getSelection().selectElement(img);
					}
				}
			}
		}
		else {
			this.remove_dialog(true);
		}
	},
	change_image: function (e) {
		var $img = $(e.target).closest(e.data.selector);
		Upfront.Media.Manager.open({
			multiple_selection: false,
			button_text: "Change image"
		}).done(function (popup, result) {
			if (!result) return false;
			if (!result.length) return false;
			var html = Upfront.Media.Manager.results_html(result);
			$img.replaceWith(html);
			e.data.bind_events();
		});
		return false;
	},
	Align: {
		_apply: function ($img, data) {
			data = $.extend({
				float: "",
				"text-align": "",
				"width": ""
			}, data);
			$img.css(data);
		},
		_get_target: function (e){
			return $($(e.target).closest("#upfront-image-details").data('ref'));
		},
		left: function (e) {
			var $wrap = e.data.Align._get_target(e),
				$img = $wrap.find('img');
			e.data.Align._apply($wrap, {float: "left"});
			e.data.Align._apply($img, {});
			e.data.remove_dialog();
			CKEDITOR.instances[e.data.instance].fire('change');
			Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'left');
			return false;
		},
		center: function (e) {
			var $wrap = e.data.Align._get_target(e),
				$img = $wrap.find('img');
			e.data.Align._apply($wrap, {
				"text-align": "center"
			});
			e.data.Align._apply($img, {});
			e.data.remove_dialog();
			CKEDITOR.instances[e.data.instance].fire('change');
			Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'center');
			return false;
		},
		right: function (e) {
			var $wrap = e.data.Align._get_target(e),
				$img = $wrap.find('img');
			e.data.Align._apply($wrap, {float: "right"});
			e.data.Align._apply($img, {});
			e.data.remove_dialog();
			CKEDITOR.instances[e.data.instance].fire('change');
			Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'right');
			return false;
		},
		full: function (e) {
			var $wrap = e.data.Align._get_target(e),
				$img = $wrap.find('img');
			e.data.Align._apply($wrap, {});
			//e.data.Align._apply($img, {width: "100%"});
			e.data.remove_dialog();
			CKEDITOR.instances[e.data.instance].fire('change');
			Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'full');
			return false;
		}
	},
	Details: {
		toggle: function (e) {
			var $dialog = $("#upfront-image-details"),
				$details = $("#upfront-image-details-image_details")
			;
			if ($details.length) e.data.Details.close(e);
			else e.data.Details.open(e);
			return false;
		},
		open: function (e) {
			var $wrapper = $(e.target).closest(e.data.selector),
				$img = $wrapper.find("img"),
				$dialog = $("#upfront-image-details"),
				$button = $dialog.find('.upfront-image-action-details'),
				$details = $('<div id="upfront-image-details-image_details" />'),
			// Gather data for form preset population
				$link = $wrapper.find("a"),
				no_link = !$link.length ? 'checked="checked"' : '',
				popup_link = $link.length && $link.is(".popup") ? 'checked="checked"' : '',
				link_link = $link.length && $link.attr("href").match(/^[^#]+/) ? 'checked="checked"' : '',
				link_value = $link.length && !!link_link ? $link.attr("href") : ''
			;
			$details.append(
				'<div class="upfront-image-detail-alt">' +
					'<label class="upfront-field-label">Image Details:</label>' +
					'<input class="upfront-field upfront-field-text" type="text" placeholder="Alt" value="' + $img.attr("alt") + '" />' +
				'</div>' +
				'<div class="upfront-image-detail-link">' +
					'<label class="upfront-field-label">Image links to:</label>' +
					'<ul>' +
						'<li><label><input class="upfront-field-radio" type="radio" ' + no_link + ' name="link_to" value="" /> No link</label></li>' +
						'<li><label><input class="upfront-field-radio" type="radio" ' + popup_link + ' name="link_to" value="popup" /> Larger version (opens in lightbox)</label></li>' +
						'<li><label><input class="upfront-field-radio" type="radio" ' + link_link + ' name="link_to" value="link" /> Link <input class="upfront-field upfront-field-text" type="text" placeholder="http://www.google.com" value="' + link_value + '" /></label></li>' +
						'<li><label><input class="upfront-field-radio" type="radio" name="link_to" value="post" /> Post or page <em>/your-cool-post/</em></label></li>' +
					'</ul>' +
				'</div>' +
				'<button class="upfront-image-detail-button" type="button">OK</button>'
			);
			/*$details.on('focus', '.upfront-image-detail-link li :text', function(e){
				$(this).siblings(':radio').prop('checked', true);
			});*/
			$details.css({
				position: "absolute",
				top: $button.offset().top + $button.height(),
				"z-index": 99
			});
			$("body").append($details);
			$details.css({
				left: $button.offset().left + 46 - ($details.width()/2),
			});
			$button.addClass('upfront-image-action-details-active');

			$details.on("click", "button", e.data, e.data.Details.apply_details);
		},
		close: function (e) {
			var $dialog = $("#upfront-image-details"),
				$button = $dialog.find('.upfront-image-action-details'),
				$details = $("#upfront-image-details-image_details");
			$button.removeClass('upfront-image-action-details-active');
			$details.remove();
		},
		apply_details: function (e) {
			var $dialog = $("#upfront-image-details"),
				$details = $("#upfront-image-details-image_details"),
				$wrapper = $dialog.closest(e.data.selector),
				$img = $wrapper.find("img"),
				$old_link = $wrapper.find("a"),
			// Data changes to apply
				alt = $details.find(".upfront-image-detail-alt :text").val(),
				link_to = $details.find(".upfront-image-detail-link :radio:checked").val(),
				link_url = $details.find(".upfront-image-detail-link :text").val()
			;

			$img.attr("alt", alt);

			if (link_to) {
				var $link = $old_link.length ? $old_link : $('<a href="#" />');
				switch (link_to) {
					case "popup":
						$link.addClass("popup");
						break;
					case "link":
						$link.attr("href", link_url);
						break;
					case "post":
						$link.attr("href", 'http://localhost/upfront/edit/post/8');
						break;
				}
				if (!$old_link.length) $img.wrapAll($link);
			} else if ($old_link.length) {
				$old_link.replaceWith($img);
			}
			return e.data.Details.close(e);
		}
	},
	cleanup: function (content) {
		var $cnt = $("<div />").append(content);
		$cnt.find("#upfront-image-details").remove();
		return $cnt.html();
	}
};

var Slider = {
	to_html: {
		exec: function (editor, e) {
			var content = e.data.dataValue,
				edited = content.replace(
					/\[upfront-gallery\](.*?)\[\/upfront-gallery\]/,
					'<div class="upfront-inline_post-gallery"><h1>Gallery</h1>$1</div>'
				)
			;
			e.data.dataValue = edited;
		}
	},
	from_html: function (content) {
		var $c = $("<div />").append(content),
			$repl = $c.find(".upfront-inline_post-gallery")
		;
		if (!$repl.length) return content;

		$repl.each(function () {
			var $me = $(this),
				gallery = ''
			;
			$me.find("h1").remove();
			gallery = $me.html();
			$me.replaceWith('[upfront-gallery]' + gallery + '[/upfront-gallery]');
		});
		return $c.html();
	}
};

CKEDITOR.plugins.add('upfront_images', Plugin);

})(jQuery);