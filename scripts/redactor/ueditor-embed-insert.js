;(function($){
define([
	"scripts/redactor/ueditor-insert",
	'text!scripts/redactor/ueditor-templates.html'
],
function(Insert, tpls){

var EmbedInsert = Insert.UeditorInsert.extend({
	type: 'embed',
	className: 'ueditor-insert upfront-inserted_embed-wrapper uinsert-drag-handle',

	defaultData: {
		code: ''
	},

	start: function () {
		var me = this,
			manager = new EmbedManager({code: this.data.get("code")}),
			deferred = new $.Deferred()
		;
		manager.on("done", function (embed) {
			me.data.set({code: embed});
			manager.remove();
			deferred.resolve(this, embed);
		});
		manager.on("render", function (main, bar, ok) {
			me.trigger("manager:rendered", manager, main, bar, ok);
		});
		Upfront.Events.on("upfront:element:edit:stop", function () {
			manager.remove();
			deferred.resolve();
		});

		this.get_manager = function () {
			return manager;
		}

		return deferred;
	},

	/**
	 * Gets internal manager object.
	 *
	 * See `start()` method for how this gets monkeypatched
	 *
	 * @return {Object} Internal EmbedManager object
	 */
	get_manager: function () { return {}; }, // Default to passthrough

	render: function () {
		var me = this,
			code = this.data.get("code"),
			$code = $("<div />").append(code)
		;
		this.$el.empty();

		if (!code) return;

		$code.append('<div class="upfront-edit_insert">edit</div>');
		this.$el.append(
			$("<div />").append($code).html()
		);

		this.$el
			.off("click", ".upfront-edit_insert")
			.on("click", ".upfront-edit_insert", function (e) {
				e.preventDefault();
				e.stopPropagation();
				me.start();
			})
		;
	},

	getOutput: function () { return this._get_output(); },
	getSimpleOutput: function () { return this._get_output(); },

	_get_output: function () {
		var code = this.data.get("code"),
			$out = $("<div />").append('<div class="upfront-inserted_embed">' + code + '</div>')
		;
		return code ? $out.html() : '';
	},

	importInserts: function(contentElement, insertsData){
		var inserts = {};
		contentElement.find('.upfront-inserted_embed').each(function () {
			var $code = $(this),
				insert = new EmbedInsert({data: {code: $code.html()}})
			;
			inserts[insert.data.id] = insert;
			insert.render();
			$code.replaceWith(insert.$el);
		});
		return inserts;
	}
});

var EmbedManager = Backbone.View.extend({
	className: "upfront-inserts-markup-editor",

	initialize: function (opts) {
		var me = this,
			code = opts && opts.code ? opts.code : ''
		;
		require([
			Upfront.Settings.ace_url
		], function () {
			me.render(code);
		});
	},

	render: function (code) {
		var me = this,
			main = new EmbedViews.Main({code: code}),
			bar = new EmbedViews.Bar(),
			ok = new EmbedViews.OK()
		;
		main.render();
		bar.render();
		ok.render();
		this.$el
			.empty()
			.append(bar.$el)
			.append(ok.$el)
			.append(main.$el)
		;

		$("body").append(this.$el);
		main.boot_editor();

		//Set correct width without sidebar
		this.$el.width($(window).width() - $('#sidebar-ui').width() -1);
		bar.on("insert", function (stuff) {
			main.insert(stuff);
		});

		this._main = main;

		ok.on("done", this.done, this);
		this.trigger("render", main, bar, ok);
	},

	done: function () {
		if (!(this._main && this._main.get_value)) return false;
		var value = this._main.get_value();
		this.trigger("done", value);
	}
});

var EmbedViews = {
	l10n: Upfront.Settings.l10n.markup_embeds,

	OK: Backbone.View.extend({
		className: 'upfront-inserts-markup-apply',

		events: { click: 'propagate_apply' },

		propagate_apply: function (e) {
			e.stopPropagation();
			e.preventDefault();
			this.trigger("done");
		},

		render: function () {
			this.$el.empty().append(
				'<a href="#">' + EmbedViews.l10n.done + '</a>'
			);
		}
	}),

	Bar: Backbone.View.extend({
		className: 'upfront-inserts-markup-bar',

		events: {
			click: 'stop_prop',
			'click .inserts-shortcode': 'request_shortcode',
			'click .inserts-image': 'request_image',
		},

		stop_prop: function (e) { e.stopPropagation(); },

		render: function () {
			this.$el.empty().append(
				'<ul>' +
					'<li><a href="#" class="inserts-shortcode">' +
						EmbedViews.l10n.insert_shortcode +
					'</a></li>' +
					'<li><a href="#" class="inserts-image">' +
						EmbedViews.l10n.insert_image +
					'</a></li>' +
				'</ul>'
			);
		},

		request_shortcode: function (e) {
			e.stopPropagation();
			e.preventDefault();
			var me = this;
			Upfront.Popup.open(function () {
				var me = this,
					shortcode = new EmbedViews.ShortcodesList()
				;
				shortcode.render();
				shortcode.on("done", function (code) {
					Upfront.Popup.close(code);
				});
				$(this).empty().append(shortcode.$el);
			}, {}, 'embed-shortcode').done(function (pop, code) {
				if( code )
					me.trigger("insert", code);
			});
		},

		request_image: function (e) {
			e.stopPropagation();
			e.preventDefault();
			var me = this;
			Upfront.Media.Manager.open({
				multiple_selection: false,
				media_type: ["images"],
				hold_editor: true
			}).done(function (pop, result) {
				if(!result) return;
				var imageModel = result.models[0],
					url = imageModel.get('image').src
				;
				url = url.replace(document.location.origin, '');
				me.trigger("insert", url);
			});
		}
	}),

	Main: Backbone.View.extend({
		className: 'upfront-embed_editor',

		events: { click: 'stop_prop' },

		code: '',

		initialize: function (opts) {
			if (opts && opts.code) this.code = opts.code;
		},

		stop_prop: function (e) { e.stopPropagation(); },

		render: function () {
			this.$el.empty()
				.append(
					'<div class="upfront-inserts-markup active">' +
						'<div class="upfront-inserts-ace"></div>' +
					'</div>'
				)
				.show()
			;
		},

		boot_editor: function () {
			var $editor_outer = this.$el,
				$editor = $editor_outer.find('.upfront-inserts-ace')
			;
			var html = $editor.html(),
				editor = ace.edit($editor.get(0)),
				syntax = $editor.data('type')
			;
			editor.getSession().setUseWorker(false);
			editor.setTheme("ace/theme/monokai");
			editor.getSession().setMode("ace/mode/html");
			editor.setShowPrintMargin(false);
			editor.getSession().setValue(this.code);

			editor.renderer.scrollBar.width = 5;
			editor.renderer.scroller.style.right = "5px";

			$editor.height($editor_outer.height());
			editor.resize();

			editor.focus();

			this.editor = editor;
		},

		insert: function (stuff) {
			this.editor.insert(stuff);
		},

		get_value: function () {
			return this.editor.getValue();
		}
	}),

	ShortcodesList: Backbone.View.extend({
		events: { click: 'stop_prop' },

		stop_prop: function (e) { e.stopPropagation(); },

		render: function () {
			var me = this;
			this.$el.empty().append(EmbedViews.l10n.waiting);
			Upfront.Util.post({action: "upfront_list_shortcodes"}).done(function (response) {
				me.$el
					.empty()
					.append('<div class="shortcode-types" />')
					.append('<div class="shortcode-list" />')
				;
				me.render_types(response.data);
				me.render_list();
			});
		},

		render_types: function (types) {
			var me = this,
				values = [{label: EmbedViews.l10n.select_area, value: 0}],
				$root = this.$el.find(".shortcode-types")
			;
			_.each(_.keys(types), function (key) {
				values.push({label: key, value: key});
			});
			var selection = new Upfront.Views.Editor.Field.Select({
				label: '',
				name: "shortcode-selection",
				width: '100%',
				values: values,
				multiple: false,
				change: function(){
					var key = this.get_value();
					if (!(key in types)) return false;
					me.render_list(types[key]);
				}
			});
			selection.render();
			$root.empty().append(selection.$el);
		},

		render_list: function (shortcodes) {
			var me = this,
				$root = this.$el.find(".shortcode-list")
			;
			$root.empty();
			if (empty(shortcodes)) return false;
			_.each(shortcodes, function (code) {
				var code = new EmbedViews.Shortcode({code: code});
				code.render();
				code.on("done", function (code) {
					me.trigger("done", code);
				});
				$root.append(code.$el);
			});
		}
	}),

	Shortcode: Backbone.View.extend({
		tagName: 'pre',

		events: { click: 'send_shortcode' },

		initialize: function (opts) {
			this.code = opts.code;
		},

		send_shortcode: function (e) {
			e.stopPropagation();
			e.preventDefault();
			if (!this.code) return false;
			this.trigger("done", '[' + this.code + ']');
		},

		render: function () {
			this.$el.empty().append('<code>[' + this.code + ']</code>');
		}
	})
};

return {
	EmbedInsert: EmbedInsert
};

//End Define
});
})(jQuery);
