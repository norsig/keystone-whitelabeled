/**
 * Adds bindings for the keystone routes
 *
 * ####Example:
 *
 *     var app = express();
 *     app.configure(...); // configuration settings
 *     app.use(...); // middleware, routes, etc. should come before keystone is initialised
 *     keystone.routes(app);
 *
 * @param {Express()} app
 * @api public
 */

function routes(app) {
	
	this.app = app;
	var keystone = this;
	
	// ensure keystone nav has been initialised
	if (!this.nav) {
		this.nav = this.initNav();
	}
	
	// Cache compiled view templates if we are in Production mode
	this.set('view cache', this.get('env') === 'production');
	
	// Bind auth middleware (generic or custom) to /keystone* routes, allowing
	// access to the generic signin page if generic auth is used
	
	if (this.get('auth') === true) {
		
		if (!this.get('signout url')) {
			this.set('signout url', '/admin/signout');
		}
		if (!this.get('signin url')) {
			this.set('signin url', '/admin/signin');
		}
		
		if (!this.nativeApp || !this.get('session')) {
			app.all('/admin*', this.session.persist);
		}
		
		app.all('/login', require('../../routes/views/signin'));
		app.all('/logout', require('../../routes/views/signout'));
		app.all('/admin*', this.session.keystoneAuth);
		
	} else if ('function' === typeof this.get('auth')) {
		app.all('/admin*', this.get('auth'));
	}
	
	var initList = function(protect) {
		return function(req, res, next) {
			req.list = keystone.list(req.params.list);
			if (!req.list || (protect && req.list.get('hidden'))) {
				req.flash('error', 'List ' + req.params.list + ' could not be found.');
				return res.redirect('/admin');
			}
			next();
		};
	};
	
	// Keystone Admin Route
	app.all('/admin', require('../../routes/views/home'));
	
	// Email test routes
	if (this.get('email tests')) {
		this.bindEmailTestRoutes(app, this.get('email tests'));
	}
	
	// Cloudinary API for image uploading (only if Cloudinary is configured)
	if (keystone.get('wysiwyg cloudinary images')) {
		if (!keystone.get('cloudinary config')) {
			throw new Error('KeystoneJS Initialisaton Error:\n\nTo use wysiwyg cloudinary images, the \'cloudinary config\' setting must be configured.\n\n');
		}
		app.post('/admin/api/cloudinary/upload', require('../../routes/api/cloudinary').upload);
	}
	
	// Cloudinary API for selecting an existing image from the cloud
	if (keystone.get('cloudinary config')) {
		app.get('/admin/api/cloudinary/get', require('../../routes/api/cloudinary').get);
		app.get('/admin/api/cloudinary/autocomplete', require('../../routes/api/cloudinary').autocomplete);
	}

	// Generic Lists API
	app.all('/admin/api/:list/:action', initList(), require('../../routes/api/list'));
	
	// Generic Lists Download Route
	app.all('/admin/download/:list', initList(), require('../../routes/download/list'));
	
	// List and Item Details Admin Routes
	app.all('/admin/:list/:page([0-9]{1,5})?', initList(true), require('../../routes/views/list'));
	app.all('/admin/:list/:item', initList(true), require('../../routes/views/item'));
	
	return this;
	
}

module.exports = routes;
