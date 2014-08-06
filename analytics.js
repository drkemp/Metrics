// Third-party modules.
var Q = require('q');
var http = require('http');
var os = require('os');

// this is a bunch of stuff that is always the same.
var GA_URL = "http://www.google-analytics.com/collect?v=1&tid=UA-52080037-1&dh=cordova.io&dp=%2F";

var eventpool=[];
var eventmax=10;
var inuse=false;


// save a command to the analytics server
exports.sendCommand = function(cid,appname, appversion, cmd) {
  var d = {t:'event', cid: cid, an: appname, av: appversion, ec: appname, ea: cmd};
  return sendEvent(d);
};

exports.sendError = function(cid,appname, appversion, cmd) {
  var d = {t:'exception', cid: cid, an: appname, av: appversion, exd: cmd, exf: '0'};
  return sendEvent(d);
};

exports.sendTiming = function(cid,appname, appversion, timecat, timeval, timevaar, timelbl) {
  var d = {t:'timing', cid: cid, an: appname, av: appversion, utc: timecat, utv: timevar, utt: timeval, utl:timelbl};
  return sendEvent(d);
};

function sendEvent(eventdata) {
  var thisos = os.platform()+":"+os.release();
  eventdata.cd = thisos;
  if(eventpool.length < eventmax) {
    inuse=true;
    return shipEvent(eventdata);
  } else {
    eventpool.push(d);
    console.log("Analytics send defer");
    setTimeout(checkpool,500);
    return Q.when();
  }
}

function checkpool() {
  if(eventpool.length > 0 && !inuse) {
    d = eventpool.shift();
    inuse=true;
    shipEvent(d).done();
    setTimeout(checkpool,500);
  } else {
    inuse=false;
  }
}

// returns a promise to send off a set of event data to the Analytics host
function shipEvent(eventdata) {
  var d = Q.defer();
  console.log("Analytics send start");
  var data = "&t="+eventdata.t+"&cid="+eventdata.cid+"&an="+eventdata.an+"&av="+eventdata.av;
  if(eventdata.t == 'event') {
     data = encodeURI(data+"&ec="+eventdata.ec+"&ea="+eventdata.ea+"&cd="+eventdata.cd);
  } else if(eventdata.t == 'exception') {
     data = encodeURI(data+"&exd="+eventdata.exd+"&exf="+eventdata.exf+"&cd="+eventdata.cd);
  } else if(eventdata.t == 'timing') {
     data = encodeURI(data+"&utc="+eventdata.utc+"&utv="+eventdata.utv+"&utt="+eventdata.utt+"&utl="+eventdata.utl+"&cd="+eventdata.cd);
  } else {
     d.reject('Invalid GA type');
  }
  data = GA_URL+data;
  console.log("ev"+data);
  http.get(data, function(res) {
    res.on('data', function(d){});
    res.on('end', function() {
      console.log("Analytics send complete");
      d.resolve('');
    });
  }).on('error', function(e) {
   console.log("Analytics send error: " + e.message);
   d.reject(error);
  });
  return d.promise;
}

