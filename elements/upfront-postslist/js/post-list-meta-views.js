(function ($) {
define([
	'text!elements/upfront-postslist/tpl/views.html',
	'scripts/redactor/ueditor-inserts'
], function(tpl, Inserts) {

	var l10n = Upfront.Settings.l10n.postslist_element;
	var $template = $(tpl);

	var Meta = {
		Embed: Inserts.inserts.embed.extend({
			meta_fields: [],
			start: function () {
				var deferred = Inserts.inserts.embed.prototype.start.apply(this),
					me = this
				;
				this.on("manager:rendered", function (manager, main, bar) {
					if (!bar) return false;
					bar.$el
						.find("ul")
						.append('<li><a href="#" class="insert_field">' + l10n.meta_insert + '</a></li>')
						.find(".insert_field").on("click", function (e) {
							e.preventDefault();
							e.stopPropagation();
							me.prepare_fields_box(bar);
							return false;
						})
					;

				});
				return deferred;
			},
			prepare_fields_box: function (bar) {
				var me = this,
					model = Upfront.Util.model_to_json(this.model),
					props = model.properties || {},
					query = {}
				;
				if (window._upfront_get_current_query) query = window._upfront_get_current_query();

				if (!this.meta_fields || !this.meta_fields.length) {
					Upfront.Util
						.post({
							action: 'upfront_postslists-list_meta',
							data: {
								props: props,
								query: query
							}
						})
						.success(function (response) {
							if (response && response.data && response.data.fields) me.meta_fields = response.data.fields;
							me.pop_fields_box(bar);
						})
					;
				} else this.pop_fields_box(bar);
			},
			pop_fields_box: function (bar) {
				var fields = this.meta_fields;
				Upfront.Popup.open(function () {
					var me = this,
						selection = new Meta.List({fields: fields})
					;
					selection.render();
					selection.on("done", function (code) {
						Upfront.Popup.close(code);
					});
					$(this).empty().append(selection.$el);
				}, {}, 'embed-shortcode').done(function (pop, code) {
					bar.trigger("insert", code);
				});
			}
		}),

		List: Backbone.View.extend({
			initialize: function (opts) {
				this.options = opts;
			},
			render: function () {
				var me = this,
					fields = this.options.fields,
					cbox = new Upfront.Views.Editor.Field.Checkboxes({
						default_value: 0,
						values: [{label: l10n.meta_toggle, value: 1}],
						change: function (val) {
							val = !!parseInt(val, 10);
							me.toggle_hidden(val);
						}
					})
				;
				cbox.render();
				this.$el
					.empty()
					.append("<h1>" + l10n.meta_fields + "</h1>")
					.append(cbox.$el)
				;
				_(fields).each(function (fld) {
					var field = new Meta.List_Field({code: fld});
					field.render();
					me.$el.append(field.$el);
					field.on("done", function (code) {
						me.trigger("done", code);
					});
				});
			},
			toggle_hidden: function (hide) {
				var $fld = this.$el.find(".wp_internal");
				if (hide) $fld.hide();
				else $fld.show();
			}
		}),

		List_Field: Backbone.View.extend({
			tagName: 'pre',
			events: { click: 'send_code' },
			initialize: function (opts) {
				this.code = opts.code;
			},
			send_code: function (e) {
				e.stopPropagation();
				e.preventDefault();
				if (!this.code) return false;
				this.trigger("done", '{{' + this.code + '}}');
			},
			render: function () {
				this.$el.empty().append('<code>' + this.code + '</code>');
				if ('_' === this.code.substr(0,1)) this.$el.addClass("wp_internal");
			}
		})
	};

	return Meta;
});
})(jQuery);
