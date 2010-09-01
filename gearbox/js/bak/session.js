/**
 * Vaporlock: a Web GUI for Transmission
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

Ext.namespace( 'Transmission' );

(function()
{
    // private constants...
    var that;
    var ROOT = '/transmission/rpc';
    var SESSION_ID_KEY = 'X-Transmission-Session-Id';
    var TAG_SOME_TORRENTS = 1;
    var TAG_ALL_TORRENTS = 2;

    // private variables...
    var sessionIdValue = '';

    function onAjaxResponse( options, success, response )
    {
        if( success )
            options.mySuccessCallback.call( options.scope, Ext.decode( response.responseText ) );
        else if( response.status == 409 ) {
            options.scope.sessionIdValue = response.getResponseHeader( 'X-Transmission-Session-Id' );
            sendRequest( options.scope, options.jsonData, options.mySuccessCallback );
        }
    };

    function sendRequest( scope, data, successCallback )
    {
        var options = { url: ROOT,
                        jsonData: data,
                        disableCaching: true,
                        callback: onAjaxResponse,
                        method: 'POST',
                        mySuccessCallback: successCallback,
                           scope: scope,
                        headers: { } };

        options.headers[SESSION_ID_KEY] = scope.sessionIdValue;

        Ext.Ajax.request( options );
    };

    function refreshSession( scope )
    {
        sendRequest( scope, { method: 'session-get' }, function( o ) {
            scope.sessionState = o['arguments'];
            scope.fireEvent( 'onSessionChanged', scope.sessionState );
        } );
    };

    function refreshStats( scope )
    {
        sendRequest( scope, { method: 'session-stats' }, function( o ) {
            scope.stats = o['arguments'];
            scope.fireEvent( 'onStatsChanged', scope.stats );
        } );
    }

    function refreshTorrents( scope )
    {
        sendRequest( scope, { method: 'torrent-get', arguments: { ids: 'recently-active', fields: getStatKeys() } }, function( o ) {
            scope.fireEvent( 'onTorrentsChanged', o.arguments );
        } );
    }

    var events = {
        onSessionChanged:  { timer: null, listenerCount: 0, interval: 20000, callback: refreshSession },
        onStatsChanged:    { timer: null, listenerCount: 0, interval: 10000, callback: refreshStats },
        onTorrentsChanged: { timer: null, listenerCount: 0, interval:  5000, callback: refreshTorrents },
    };

    function toggleRefresh( scope, ev, enabled ) {
        if( enabled && ev.timer == null ) {
            ev.timer = setInterval( function(){ ev.callback(scope); }, ev.interval );
            ev.callback( scope );
        } else {
            clearInterval( ev.timer );
            ev.timer = null;
        }
    }

    function invokeNowAndResetTimer( ev ) {
        toggleRefresh( that, ev, false );
        toggleRefresh( that, ev, true );
    }

    function getExtraStatKeys( )
    {
        return Torrent.getExtraStatKeys( );
    }

    function getStatKeys( )
    {
        return Torrent.getStatKeys( );
    }

    function getInfoKeys( )
    {
        return Torrent.getInfoKeys( );
    }

    Transmission.Session = Ext.extend( Ext.util.Observable, {
        sessionState: { },

        constructor: function( config ) {
            that = this;
            this.name = config.name;
            for( var name in events )
                this.addEvents( name );
            this.listeners = config.listeners;
            Transmission.Session.superclass.constructor.call(this, config)
        },

        addListener: function( key, func )
        {
            var ev = events[key];
            if( ev != undefined ) {
                ev.name = key;
                if( !ev.listenerCount++ )
                    toggleRefresh( this, ev, true );
            }

            Transmission.Session.superclass.addListener.call( this, key, func );
        },

        removeListener: function( key, func )
        {
            var ev = events[key];
            if( !--ev.listenerCount )
                toggleRefresh( this, ev, false );

            Transmission.Session.superclass.removeListener.call( this, key, func );
        },

        set: function( args )
        {
            sendRequest( that, { method: 'session-set', arguments: args }, function( o ) {
                var ev = events.onSessionChanged;
                if( ev.listenerCount > 0 )
                    invokeNowAndResetTimer( ev );
            } );
        },

        updateTorrents: function( )
        {
            var ev = events.onTorrentsChanged;
            if( ev.listenerCount > 0 )
                invokeNowAndResetTimer( ev );
        },

        verbTorrents: function( idArray, method )
        {
            sendRequest( that, { method: method, arguments: { ids: idArray } }, function(o) {
                that.updateTorrents( );
            } );
        },
  
        startTorrents    : function( idArray ) { this.verbTorrents( idArray, 'torrent-start'      ); },
        stopTorrents     : function( idArray ) { this.verbTorrents( idArray, 'torrent-stop'       ); },
        verifyTorrents   : function( idArray ) { this.verbTorrents( idArray, 'torrent-verify'     ); },
        announceTorrents : function( idArray ) { this.verbTorrents( idArray, 'torrent-reannounce' ); },

        removeTorrents: function( ids, deleteFiles )
        {
            var args = { };
            args['ids'] = ids;
            args['delete-local-data'] = deleteFiles || false;
            sendRequest( that, { method: 'torrent-remove', arguments: args }, function( o ) {
                that.updateTorrents( that );
            });
        },

        getSessionId: function( )
        {
            return this.sessionIdValue;
        },

        initTorrents: function( ids )
        {
            var args = { fields: getStatKeys().concat(getInfoKeys()) };
            var req = { method: 'torrent-get', arguments: args };
            if( ids==null || ids==undefined || !ids.length )
                req.tag = TAG_ALL_TORRENTS;
            else {
                req.tag = TAG_SOME_TORRENTS;
                args.ids = ids;
            }
            req.arguments = args;
            sendRequest( that, req, function( o ) {
                this.fireEvent( 'onTorrentsChanged', o.arguments );
            } );
        },

        updateExtraStats: function( idArray )
        {
            var args = { fields: getStatKeys().concat(getExtraStatKeys()), ids: idArray };
            var req = { method: 'torrent-get', arguments: args };
            sendRequest( that, req, function( o ) {
                this.fireEvent( 'onTorrentsChanged', o.arguments );
            } );
        },

        setFilesWanted: function( torrentId, fileIdArray, isWanted )
        {
            var idArray = [ torrentId ];
            var args = { ids: idArray };
            args[isWanted ? 'files-wanted' : 'files-unwanted'] = fileIdArray;
            var req = { method: 'torrent-set', arguments: args };
            sendRequest( that, req, function( o ) { this.updateExtraStats( idArray ); } );
        },

        setFilePriorities: function( torrentId, fileIdArray, priority )
        {
            var key;
            switch( priority ) {
                case Torrent.PRIORITY_LOW: key = 'priority-low'; break;
                case Torrent.PRIORITY_HIGH: key = 'priority-high'; break;
                default: key = 'priority-normal'; break;
            }

            var idArray = [ torrentId ];
            var args = { ids: idArray };
            args[key] = fileIdArray;
            var req = { method: 'torrent-set', arguments: args };
            sendRequest( that, req, function( o ) { this.updateExtraStats( idArray ); } );
        },

        removeTrackers: function( torrentId, announceUrlArray )
        {
            var req = { method: 'torrent-set', arguments: { ids: [ torrentId ], trackerRemove: announceUrlArray } };
            sendRequest( that, req, function() { this.updateExtraStats( [ torrentId ] ); } );
        },

        addTrackers: function( torrentId, announceUrlArray )
        {
            var req = { method: 'torrent-set', arguments: { ids: [ torrentId ], trackerAdd: announceUrlArray } };
            sendRequest( that, req, function() { this.updateExtraStats( [ torrentId ] ); } );
        },

        replaceTracker: function( torrentId, oldUrl, newUrl )
        {
            var req = { method: 'torrent-set', arguments: { ids: [ torrentId ], trackerReplace: [ oldUrl, newUrl ] } };
            sendRequest( that, req, function() { this.updateExtraStats( [ torrentId ] ); } );
        }
    });
}());
