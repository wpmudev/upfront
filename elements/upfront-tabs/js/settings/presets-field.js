define(function() {
	var PresetsField = Upfront.Views.Editor.Field.Select.extend({
		className: 'preset',

		render: function() {
			Upfront.Views.Editor.Field.Select.prototype.render.call(this);
			var html = ['<a href="#" title="Edit preset" class="upfront-preset-edit">edit preset</a>'];
			this.$el.append(html.join(''));
			return this;
		},

		remove: function(){
			Upfront.Views.Editor.Field.Field.prototype.remove.call(this);
		}
	});

	return PresetsField;
});
