define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var Field_Complex_Toggleable_Text_Field = Upfront.Views.Editor.Field.Field.extend({
		className: "upfront-field-complex_field-boolean_toggleable_text upfront-field-multiple",
		tpl: '<input type="checkbox" class = "upfront-field-checkbox" /> <label><span class="upfront-field-label-text">{{element_label}}</span></label> <div class="upfront-embedded_toggleable" style="display:none">{{field}}<div class="upfront-embedded_toggleable-notice">' + Upfront.Settings.l10n.global.views.anchor_nag + '</div></div>',
		initialize: function (opts) {
			Upfront.Views.Editor.Field.Field.prototype.initialize.call(this, opts);
			this.options.field = new Upfront.Views.Editor.Field.Text(this.options);
		},
		render: function () {
			var me = this;
			this.$el.empty();
			this.$el.append(this.get_field_html());

			this.$el.on("click", ':checkbox', function (e) {
				e.stopPropagation();
				me.field_toggle.apply(me);
			});
			if (this.model.get_property_value_by_name(this.options.field.get_name())) {
				this.$el.find(':checkbox').attr("checked", true);
				this.check_value();
				this.field_toggle();
			}

			this.$el.on("keyup", '[name="' + this.options.field.get_name() + '"]', function (e) {
				e.stopPropagation();
				me.check_value.apply(me);
			});

			setTimeout(function () {
				me.trigger("anchor:updated");
			}, 50);
		},
		field_toggle: function () {
			if (this.$el.find(":checkbox").is(":checked")) {
				this.$el.find(".upfront-embedded_toggleable").show();
			} else {
				this.$el.find(".upfront-embedded_toggleable").hide();
			}
			this.property.set({value: this.get_value()});
			this.trigger("anchor:updated");
		},
		check_value: function () {
			var $field = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
				$root = this.$el.find(".upfront-embedded_toggleable"),
				val = $field.length && $field.val ? $field.val() : ''
			;
			$root.removeClass("error").removeClass("ok");
			if (val.length && !val.match(/^[a-zA-Z]+$/)) {
				$root.addClass("error");
			} else if (val.length) {
				$root.addClass("ok");
			}
			this.property.set({value: this.get_value()});
		},
		get_field_html: function () {
			this.options.field.render();
			var $input = this.options.field.$el;
			return _.template(this.tpl, _.extend({}, this.options, {field: $input.html()}));
		},
		get_value: function () {
			var data = {},
				$field = this.$el.find(":checkbox"),
				$subfield = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
				value = $subfield.val().replace(/[^a-zA-Z]/g, '')
			;
			return $field.is(":checked") && value ? value : ''; // was false
		}
	});

	var AnchorSettingsModule = BaseModule.extend({
		className: "upfront-settings-item-anchor",

		initialize: function (opts) {
			this.options = opts;

			var anchorField = new Field_Complex_Toggleable_Text_Field({
				element_label: Upfront.Settings.l10n.global.views.make_element_anchor,
				className: 'upfront-field-complex_field-boolean_toggleable_text upfront-field-multiple checkbox-title',
				model: this.model,
				property: 'anchor'
			});

			anchorField.on("anchor:updated", function () {
				this.trigger("anchor:item:updated");
			}, this);

			this.fields = _([anchorField]);
		},

		save_fields: function () {
			this.fields.invoke("check_value");
			BaseModule.prototype.save_fields.call(this);
		}
	});

	return AnchorSettingsModule;
});
