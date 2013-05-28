CKEDITOR.plugins.add( 'kitchensink', {
	init: function( editor ) {
		editor.addCommand( 'showhideKitchenSink', {
			exec: function( editor ) {
				var new_state = this.state == CKEDITOR.TRISTATE_ON ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_ON,
					editor = jQuery('.'+editor.id),
					toolbox =  jQuery('.cke_toolbox', editor);

				this.setState( new_state );

				// Keep the bottom left corner of copy editor panel in the same position
				// when rows are hidden/shown.

				var height_diff = 41, // 41px = 34px icon height + 7px horizontal divider
					current_top = parseInt(editor.css('top'), 10),
					new_top = 0,
					complete = function(){};

				if( new_state == CKEDITOR.TRISTATE_ON ){
					// Show all rows
					new_top = current_top + (-height_diff);
					complete = function(){
						toolbox.removeClass('rows-only-first');
					}
				}else{
					// Show only first row
					new_top = current_top + height_diff;
					toolbox.addClass('rows-only-first');
				}
				
				editor.animate(
					{	'top': new_top.toString()+'px'	},
					{
						duration: 90,
						queue: false,
						complete: complete
					}
				);
			}
		});
		editor.ui.addButton( 'KitchenSink', {
			label: 'Show/Hide Extra Options',
			command: 'showhideKitchenSink',
			toolbar: 'basicstyles'
		});
	}
});