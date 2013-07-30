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
			Image.bind_events(e.editor.name);
		});
		editor.on("change", function (e) {
			Image.bind_events(e.editor.name);
		});
		editor.on("destroy", function (e) {
			Image.unbind_events(e.editor.name);
		});
		Upfront.Media.Transformations.add(Image.cleanup);
	}
};

var Image = {
	selector: "div.upfront-inserted_image-wrapper",
	bind_events: function (cke) {
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
	},
	hover_on: function (e) {
		var $me = $(e.target),
			offset = $me.position(),
			$dialog = $("<div id='upfront-image-details' />")
		;
		if ($("#upfront-image-details").length) $("#upfront-image-details").remove();
		if (!$me.is(e.data.selector)) $me = $me.closest(e.data.selector);
		$dialog.append(
			'<div class="orientation">' +
				'<div class="left"><i class="icon-align-left"></i> Left</div>' +
				'<div class="center"><i class="icon-align-center"></i> Center</div>' +
				'<div class="right"><i class="icon-align-right"></i> Right</div>' +
				'<div class="full"><i class="icon-th-large"></i> Full width</div>' +
			'</div>' +
			'<div class="actions">' +
				'<div class="change"><span><i class="icon-file"></i> Change Image</span></div>' +
				'<div class="details"><span><i class="icon-list-alt"></i> Image Details</span></div>' +
			'</div>'
		);
		$me.append($dialog);
		$dialog.css({
			"top": ((offset.top + $me.height()) - $dialog.height()),
			"width": $me.find("img").width()
		});

		$dialog
			.find(".left").on("click", e.data, e.data.Align.left).end()
			.find(".center").on("click", e.data, e.data.Align.center).end()
			.find(".right").on("click", e.data, e.data.Align.right).end()
			.find(".full").on("click", e.data, e.data.Align.full).end()

			.find(".change").on("click", e.data, e.data.change_image).end()
			.find(".details").on("click", e.data, e.data.Details.toggle).end()
		;
	},
	hover_off: function (e) {
		var $me = $(e.target),
			$dialog = $("#upfront-image-details"),
			$details = $("#upfront-image-details-image_details")
		;
		if (!$details.length) $dialog.remove();
	},
	change_image: function (e) {
		var $img = $(e.target).closest(e.data.selector);
		Upfront.Media.Manager.open().done(function (popup, result) {
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
		left: function (e) {
			var $img = $(e.target).closest(e.data.selector);
			e.data.Align._apply($img, {float: "left"});
			return false;
		},
		center: function (e) {
			var $img = $(e.target).closest(e.data.selector);
			e.data.Align._apply($img, {
				"width": "100%",
				"text-align": "center"
			});
			return false;
		},
		right: function (e) {
			var $img = $(e.target).closest(e.data.selector);
			e.data.Align._apply($img, {float: "right"});
			return false;
		},
		full: function (e) {
			var $img = $(e.target).closest(e.data.selector);
			e.data.Align._apply($img, {float: ""});
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
				$details = $('<div id="upfront-image-details-image_details" />'),
			// Gather data for form preset population
				$link = $wrapper.find("a"),
				no_link = !$link.length ? 'checked="checked"' : '',
				popup_link = $link.length && $link.is(".popup") ? 'checked="checked"' : '',
				link_link = $link.length && $link.attr("href").match(/^[^#]+/) ? 'checked="checked"' : '',
				link_value = $link.length && !!link_link ? $link.attr("href") : ''
			;
			$details.append(
				'<div class="alt">' +
					'<label>Image Details</label>' +
					'<input type="text" placeholder="Alt" value="' + $img.attr("alt") + '" />' +
				'</div>' +
				'<div class="link">' +
					'<label>Image links to:</label>' +
					'<ul>' +
						'<li><input type="radio" ' + no_link + ' name="link_to" value="" /> No link</li>' +
						'<li><input type="radio" ' + popup_link + ' name="link_to" value="popup" /> Larger version (opens in lightbox)</li>' +
						'<li><input type="radio" ' + link_link + ' name="link_to" value="link" /> <input type="text" placeholder="http://www.google.com" value="' + link_value + '" /></li>' +
						'<li><input type="radio" name="link_to" value="post" /> Post or page <em>/your-cool-post/</em></li>' +
					'</ul>' +
				'</div>' +
				'<button type="button">OK</button>'
			);
			$details.css({
				position: "absolute",
				top: $dialog.offset().top + $dialog.height() + 5,
				left: $dialog.offset().left,
				"z-index": 99,
				background: "white"
			});
			$("body").append($details);

			$details.on("click", "button", e.data, e.data.Details.apply_details);
		},
		close: function (e) {
			var $details = $("#upfront-image-details-image_details");
			$details.remove();
		},
		apply_details: function (e) {
			var $dialog = $("#upfront-image-details"),
				$details = $("#upfront-image-details-image_details"),
				$wrapper = $dialog.closest(e.data.selector),
				$img = $wrapper.find("img"),
				$old_link = $wrapper.find("a"),
			// Data changes to apply
				alt = $details.find(".alt :text").val(),
				link_to = $details.find(".link :radio:checked").val(),
				link_url = $details.find(".link :text").val()
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