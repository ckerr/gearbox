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

Ext.namespace( 'Transmission' );

PeerView = Ext.extend( Ext.grid.GridPanel,
{
    torrentId: -1,

    store: null,

    renderPeer: function( value, metadata, record, rowIndex, colIndex, store )
    {
        return '<b>Peer</b>';
    },

    onTorrentUpdated: function( torstore, record, operation )
    {
        if( this.torrentId != record.getId() )
            return;
        if( !Ext.isArray( record.data.peers ) )
            return;

        var addme = { peers: [ ] };
        var peerStore = this.store;
        var peers = record.data.peers;
        var newPeers = [ ];
        for( var i=0, n=peers.length; i<n; ++i )
        {
            var peer = peers[i];

            newPeers.push( peer.address );

            var r = peerStore.getById( peer.address );
            if( !r ) // new peer
                addme.peers.push( peer );
            else {
                r.beginEdit();
                Ext.iterate( peer, function(key,value) { r.set( key, value ); } );
                r.endEdit();
            }
         }
         this.store.commitChanges();

         // new peers...
         if( addme.peers.length > 0 )
            peerStore.loadData( addme, true );

        // removed peers...
        var oldPeers = peerStore.getRange( );
        for( var i=0, n=oldPeers.length; i<n; ++i )
            if( newPeers.indexOf( oldPeers[i].data.address ) == -1 )
                peerStore.remove( oldPeers[i] );
    },

    renderEncrypted: function( value, metaData, record, rowIndex, colIndex, store )
    {
        if( value )
            return ['<img src="', Transmission.imgRoot, '/16x16/emblems/emblem-encrypted.png"/>' ].join('');
        return '';
    },

    renderSpeedBps: function( bps, metaData, record, rowIndex, colIndex, store )
    {
        if( !bps )
            return '';
        else
            return Ext.util.Format.number( Transmission.fmt.toKBps( bps ), '0.0' );
    },

    renderPercent: function( value, metaData, record, rowIndex, colIndex, store )
    {
        return String.format( '{0}%', Math.floor(100.0*value) );
    },

    constructor: function( config_in )
    {
        this.torrentId = config_in.record.getId( );

        var record = Ext.data.Record.create([
            { name: 'address', type: 'string', sortType: function( value ) {
                var a = value.split('.');
                var r = 0;
                for( var i = a.length; i > 0; --i )
                    r += a[i-1] * Math.pow( 10, 3*(4-i) );
                return r; } },
            { name: 'clientName', type: 'string' },
            { name: 'clientIsChoked', type: 'boolean' },
            { name: 'clientIsInterested', type: 'boolean' },
            { name: 'flagStr', type: 'string' },
            { name: 'isDownloadingFrom', type: 'boolean' },
            { name: 'isEncrypted', type: 'boolean' },
            { name: 'isIncoming', type: 'boolean' },
            { name: 'isUploadingTo', type: 'boolean' },
            { name: 'peerIsChoked', type: 'boolean' },
            { name: 'peerIsInterested', type: 'boolean' },
            { name: 'port', type: 'int' },
            { name: 'progress', type: 'float' },
            { name: 'rateToClient', type: 'float' },
            { name: 'rateToPeer', type: 'float' }
        ]);

        var reader = new Ext.data.JsonReader( { idProperty: 'address', root: 'peers', fields: record } );

        var store = new Ext.data.Store( { reader: reader } );
        store.setDefaultSort( 'address' );

        var colModel = new Ext.grid.ColumnModel( {
            defaults: { sortable: true },
            columns: [
                { dataIndex: 'isEncrypted', width: 14, renderer: this.renderEncrypted },
                { dataIndex: 'rateToPeer', width: 60, align: 'right', header: 'Up', renderer: this.renderSpeedBps },
                { dataIndex: 'rateToClient', width: 60, align: 'right', header: 'Down', renderer: this.renderSpeedBps },
                { dataIndex: 'progress', width: 60, align: 'right', header: '%', renderer: this.renderPercent },
                { dataIndex: 'flagStr', width: 80, header: 'Status' },
                { dataIndex: 'address', width: 150, header: 'Address' },
                { dataIndex: 'clientName', header: 'Client', id: 'client' }
            ]
        });

        var config = Ext.apply( {}, config_in, {
            frame: false,
            colModel: colModel,
            store: store,
            enableHdMenu: false,
            viewConfig: { forceFit: true },
            stripeRows: true,
            autoExpandColumn: 'client',
            autoFill: true
        } );

        PeerView.superclass.constructor.call( this, config );

        if( Ext.isArray( config.record.data.peers ) )
             this.store.loadData( config.record.data, true );

        Torrent.store.addListener( 'update', this.onTorrentUpdated, this );
    },

    destroy: function( )
    {
        Torrent.store.removeListener( 'update', this.onTorrentUpdated, this );
        PeerView.superclass.destroy.call( this );
    }
});

Ext.reg( 'peerview', PeerView );
