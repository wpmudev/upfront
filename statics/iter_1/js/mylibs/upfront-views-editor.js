(function () {

var _template_files = [
	"text!../mylibs/templates/property.html",
	"text!../mylibs/templates/properties.html",
	"text!../mylibs/templates/property_edit.html",
];

define(_template_files, function () {
	// Auto-assign the template contents to internal variable
	var _template_args = arguments,
		_Upfront_Templates = {}
	;
	_(_template_files).each(function (file, idx) {
		if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!..\/mylibs\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
	});

	// Stubbing interface control

	var Property = Backbone.View.extend({
		events: {
			"click .upfront-property-change": "show_edit_property_partial",
			"click .upfront-property-save": "save_property",
			"click .upfront-property-remove": "remove_property",
		},
		render: function () {
			var template = _.template(_Upfront_Templates.property, this.model.toJSON());
			this.$el.html(template);
		},

		remove_property: function () {
			this.model.destroy();
		},
		save_property: function () {
			var name = this.$("#upfront-new_property-name").val(),
				value = this.$("#upfront-new_property-value").val()
			;
			this.model.set({
				"name": name,
				"value": value
			});
			this.render();
		},
		show_edit_property_partial: function () {
			var template = _.template(_Upfront_Templates.property_edit, this.model.toJSON());
			this.$el.html(template);
		}
	});

	var Properties = Backbone.View.extend({
		events: {
			"click #add-property": "show_new_property_partial",
			"click #done-adding-property": "add_new_property",
		},
		initialize: function () {
			//console.log(this.model)
			this.model.get("properties").bind("change", this.render, this);
			this.model.get("properties").bind("add", this.render, this);
			this.model.get("properties").bind("remove", this.render, this);
		},
		render: function () {
			var template = _.template(_Upfront_Templates.properties, this.model.toJSON());
			this.$el.html(template);
			this.model.get("properties").each(function (obj) {
				var local_view = new Property({"model": obj});
				local_view.render();
				this.$("dl").append(local_view.el)
			});
		},

		show_new_property_partial: function () {
			this.$("#add-property").hide();
			this.$("#upfront-new_property").slideDown();
		},
		add_new_property: function () {
			var name = this.$("#upfront-new_property-name").val(),
				value = this.$("#upfront-new_property-value").val()
			;
			this.model.get("properties").add(new Upfront.Models.Property({
				"name": name,
				"value": value
			}));
			this.$("#upfront-new_property")
				.slideUp()
				.find("input").val('').end()
			;	
			this.$("#add-property").show();
		}
	});


	var Command = Backbone.View.extend({
		"tagName": "li",
		"events": {
			"click": "on_click"
		},
		on_click: function () { this.render(); }
	});

	var Command_AddModule = Command.extend({
		render: function () {
			this.$el.html('Add new module');
		},
		on_click: function () {
			var module = new Upfront.Models.Module({
				"name": "Test module",
				"properties": [
					{"name": "element_id", "value": "test-111"},
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c8 ml2"}
				],
				"objects": [
					{
						"name": "O1",
						"properties": [
							{"name": "element_id", "value": Upfront.Util.get_unique_id("object")},
							{"name": "class", "value": "c22"}
						]
					}
				]
			});
			if (!this.model.get("regions").active_region) return alert("select a region")
			this.model.get("regions").active_region.get("modules").add(module);
		}
	});

	var Command_SaveLayout = Command.extend({
		render: function () {
			this.$el.html("Save layout");
		},
		on_click: function () {
			//this.model.save();
			var raw = this.model.toJSON(),
				data_str = JSON.stringify(raw),
				data = JSON.parse(data_str)
			;
			console.log(data);
		}

	});

	var Commands = Backbone.View.extend({
		"tagName": "ul",

		initialize: function () {
			this.commands = _([
				new Command_AddModule({"model": this.model}),
				new Command_SaveLayout({"model": this.model})
			]);
		},
		render: function () {
			var $el = this.$el;
			this.commands.each(function (command) {
				command.render();
				$el.append(command.el);
			});
		}
	});

	return {
		"Editor": {
			"Property": Property,
			"Properties": Properties,
			"Commands": Commands
		}
	};
});

})();