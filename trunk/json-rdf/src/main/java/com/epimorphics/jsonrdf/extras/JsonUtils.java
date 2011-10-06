package com.epimorphics.jsonrdf.extras;

import org.openjena.atlas.json.JsonArray;
import org.openjena.atlas.json.JsonObject;
import org.openjena.atlas.json.JsonValue;

public class JsonUtils {

	public static String optString(JsonObject jo, String k,	String ifAbsent ) {
		JsonValue result = jo.get(k);
		return result == null ? ifAbsent : result.getAsString().value();
	}

	public static String getString(JsonObject jo, String k ) {
		JsonValue result = jo.get(k);
		return result.getAsString().value();
	}

	public static JsonArray getArray(JsonObject jo, String k) {
		JsonValue jv = jo.get(k);
		return jv == null ? null : jv.getAsArray();
	}

}
