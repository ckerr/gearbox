/**
 * Gearbox: a Web GUI for Transmission
 * 
 * Copyright (c) Mnemosyne LLC
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */
  
/*global Ext, Application */
   
Ext.ns('Transmission');

// application main entry point
Ext.onReady(function()
{
    Transmission.imgRoot = './gearbox/images';
    Ext.BLANK_IMAGE_URL = Transmission.imgRoot + '/s.gif';

    Ext.QuickTips.init();
    var config = { };

    config.session = new Transmission.Session( config  );
    config.prefs   = new Transmission.Prefs  ( config );
    config.mainwin = new Transmission.MainWin( config );
    config.controller = new Transmission.Controller( config );

    // hide the URL bar on iPhone/Android type devices
    window.scrollTo(0,1);

    // get the torrents
    config.session.initTorrents( );

    config.session.addListener( 'onTorrentsChanged', function( args )
    {
        var newIds = [ ];
        var addme = { torrents: [ ] };

        // updated torrents...
        var torrents = args.torrents;
        for( var i=0, n=torrents.length; i<n; ++i ) {
            var torrent = torrents[i];
            var r = Torrent.store.getById( torrent.id );
            if( r ) {
                r.beginEdit();
                Ext.iterate( torrent, function(key,value) {
                    r.set( key, value );
                    if( key == 'name' )
                        r.set( 'collatedName', Ext.util.Format.lowercase(value.trim()) );
                } );
                r.set('rateXfer', r.data.rateUpload + r.data.rateDownload );
                r.endEdit();
            } else { // new torrent
                if( torrent.name )
                    torrent.collatedName = Ext.util.Format.lowercase(torrent.name.trim());
                torrent.rateXfer = torrent.rateUpload + torrent.rateDownload;
                addme.torrents.push( torrent );
                newIds.push( torrent.id );
            }
        }

        // added torrents...
        if( addme.torrents.length > 0 )
            Torrent.store.loadData( addme, true );
        if( newIds.length > 0 )
            config.session.initTorrents( newIds );

        // removed torrents...
        var removed = args.removed;
        if( removed )
            for( var i=0, n=removed.length; i<n; ++i )
                Torrent.store.remove( Torrent.store.getById( removed[i] ) );

        Torrent.store.commitChanges();
    });
});
