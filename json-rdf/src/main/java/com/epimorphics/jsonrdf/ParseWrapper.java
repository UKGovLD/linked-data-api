package com.epimorphics.jsonrdf;

import java.io.Reader;
import java.io.StringReader;

import org.openjena.atlas.json.JsonArray;
import org.openjena.atlas.json.JsonObject;
import org.openjena.atlas.json.io.JSONMaker;
import org.openjena.atlas.json.io.parser.JSONParser;

public class ParseWrapper {

	public static JsonObject stringToJsonObject(String s) {
		JSONMaker jm = new JSONMaker();
		JSONParser.parseAny(new StringReader(s), jm);
		return jm.jsonValue().getAsObject();
	}

	public static JsonArray stringToJsonArray(String s) {
		JSONMaker jm = new JSONMaker();
		JSONParser.parseAny(new StringReader(s), jm);
		return jm.jsonValue().getAsArray();
	}
	
	public static JsonObject readerToJsonObject(Reader r) {
		JSONMaker jm = new JSONMaker();
		JSONParser.parseAny(r, jm);
		return jm.jsonValue().getAsObject();
	}

}
