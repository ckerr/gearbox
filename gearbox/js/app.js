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
   
Ext.BLANK_IMAGE_URL = './ext/resources/images/default/s.gif';
Ext.ns('Transmission');

Transmission.imgRoot = './gearbox/images';

// application main entry point
Ext.onReady(function()
{
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
            var recordIndex = Torrent.store.findExact( 'id', torrent.id );
            if( recordIndex < 0 ) { // new torrent
                if( torrent.name )
                    torrent.collatedName = Ext.util.Format.lowercase(torrent.name.trim());
                addme.torrents.push( torrent );
                newIds.push( torrent.id );
            } else {
                var r = Torrent.store.getAt( recordIndex );
                Ext.iterate( torrent, function(key,value) {
                    r.set( key, value );
                    if( key == 'name' )
                        r.set( 'collatedName', Ext.util.Format.lowercase(value.trim()) );
                } );
            }
        }
        Torrent.store.commitChanges();

        // added torrents...
        if( addme.torrents.length > 0 )
            Torrent.store.loadData( addme, true );
        if( newIds.length > 0 )
            config.session.initTorrents( newIds );

        // removed torrents...
        var removed = args.removed;
        if( removed )
            for( var i=0, n=removed.length; i<n; ++i )
                Torrent.store.removeAt( Torrent.store.findExact( 'id', removed[i] ) );
    });
});
