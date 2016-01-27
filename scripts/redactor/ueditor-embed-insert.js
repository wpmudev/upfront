;(function($){
define([
        "scripts/redactor/ueditor-insert",
        'text!scripts/redactor/ueditor-templates.html'
    ],
    function(Insert, tpls){
/*
var EmbedInsert = UeditorInsert.extend({
		type: 'embed',
		className: 'ueditor-insert upfront-inserted_embed-wrapper uinsert-drag-handle',
		tpl: _.template($(tpls).find('#embed-insert-tpl').html()),
		defaultData : {
			code : " "
		},
		//Called just after initialize
		init: function(){
				var align = this.getAligmnentControlData(['left', 'center', 'full', 'right']);
			align.selected = this.data.get('align') || 'center',

			this.controlsData = [
				align,
			   {id: 'code', type: 'dialog', icon: 'embed', tooltip: 'Change code', view: this.getFormView()},
			   this.getRemoveControlData()
			];

			//this.createControls();
		},

		// Insert editor UI
		render: function(){
			var data = this.data.toJSON();
			this.$el
				.html(this.tpl(data))
				.removeClass('aligncenter alignleft alignright alignfull')
				.addClass('align' + this.data.get('align'))
			;

			this.controls.render();
			this.$el.append(this.controls.$el);
		},

		//this function is called automatically by UEditorInsert whenever the controls are created or refreshed
		controlEvents: function(){
			this.stopListening(this.controls);
			this.listenTo(this.controls, 'control:click:remove', function(control){
				this.trigger('remove', this);
			});

			this.listenTo(this.controls, 'control:select:alignment', function(control){
				this.data.set('align', control);
			});
			this.listenTo(this.controls, 'control:ok:code', function(view, control){
				var data = {
					code: view.$('textarea').val()
				};
				this.data.set(data);
				control.close();
			});
		},
		start: function(){
			//Dumb start method returning a resolved promise. Override it if async start needed.
			var deferred = $.Deferred();
			deferred.resolve();
			this.onStartActions();
			return deferred.promise();
		},
		onStartActions : function() {
			var self = this;

			//Show the embed form after clicking on embed element
			this.controls.$el.show(function(){
				self.controls.$el.find(".upfront-icon-region-embed").next(".uimage-control-panel").show();
				self.controls.$el.find(".upfront-icon-region-embed").click();
				self.controls.$el.find(".upfront-field-embed_code").focus();
			});
		},
		// Returns output for the element to inserted into the dome
		// @returns html
	getOutput: function(){
		var out = this.el.cloneNode(),
			data = this.data.toJSON()
		;

		out.innerHTML = this.tpl(data);
		// return the HTML in a string
		return  $('<div>').html(out).html();
	},


	// Parse the content of the post looking for embed insert elements.
	importInserts: function(contentElement, insertsData){
		var me = this,
			codes = contentElement.find('.upfront-inserted_embed-wrapper'),
			inserts = {}
			;
		codes.each(function(){
			var $code = $(this),
				insert = false
				;

			if($code.length)
				insert = me.importFromWrapper($(this), insertsData);
			else
				insert = EmbedInsert({data: "Default data"});

			inserts[insert.data.id] = insert;
		});

		return inserts;
	},
	//Import from embed insert wrapper
	importFromWrapper: function(wrapper, insertsData){
		var id = wrapper.attr('id'),
			insert = false,
			align = false
			;
		insert = new EmbedInsert({data: insertsData[id]});
		insert.render();
		wrapper.replaceWith(insert.$el);
		return insert;
	},

	 getFormView: function(){
		 if(this.formView)
			 return this.formView;

		 var view = new EmbedFormView({data: {code: this.data.get('code')}});
		 this.formView = view;

		 view.on();
		 return view;
	 }
});

var EmbedFormView = Backbone.View.extend({
	tpl: _.template($(tpls).find('#embed-insert-form-tpl').html()),
	initialize: function(opts){
		if(opts.data){
			this.model = new Backbone.Model(opts.data);
			this.listenTo(this.model, 'change', this.render);
		}
	},
	events: {
		//'change input[type=radio]': 'updateData'
	},
	render: function(){
		this.$el.width('400px');
		var data = this.model.toJSON();
		this.$el.html(this.tpl(data));
	}
});
*/

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
					'<li><a href="#" class="inserts-shortcode">' + EmbedViews.l10n.insert_shortcode + '</a></li>' +
					'<li><a href="#" class="inserts-image">' + EmbedViews.l10n.insert_image + '</a></li>' +
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
});})(jQuery);
