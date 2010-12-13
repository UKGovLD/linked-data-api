<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:wgs84_pos="http://www.w3.org/2003/01/geo/wgs84_pos#"
	xmlns:spatial="http://data.ordnancesurvey.co.uk/ontology/spatialrelations/"
	xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
	xmlns:skos="http://www.w3.org/2004/02/skos/core#"
	xmlns:foaf="http://xmlns.com/foaf/0.1/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	version="1.0">
	
<xsl:key name="properties" match="/result/items/item/* | /result[not(items)]/primaryTopic/*" use="name(.)" />
<xsl:key name="properties" match="/result/items/item/*/* | /result[not(items)]/primaryTopic/*/*" use="concat(name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/* | /result[not(items)]/primaryTopic/*/*/*" use="concat(name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*" use="concat(name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*/*" use="concat(name(../../../..), '.', name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*/*/*" use="concat(name(../../../../..), '.', name(../../../..), '.', name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*/*/*/*" 
	use="concat(name(../../../../../..), '.', name(../../../../..), '.', name(../../../..), '.', name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/*/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*/*/*/*/*" 
	use="concat(name(../../../../../../..), '.', name(../../../../../..), '.', name(../../../../..), '.', name(../../../..), '.', name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/*/*/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*/*/*/*/*/*" 
	use="concat(name(../../../../../../../..), '.', name(../../../../../../..), '.', name(../../../../../..), '.', name(../../../../..), '.', name(../../../..), '.', name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />
<xsl:key name="properties" match="/result/items/item/*/*/*/*/*/*/*/*/*/* | /result[not(items)]/primaryTopic/*/*/*/*/*/*/*/*/*/*" 
	use="concat(name(../../../../../../../../..), '.', name(../../../../../../../..), '.', name(../../../../../../..), '.', name(../../../../../..), '.', name(../../../../..), '.', name(../../../..), '.', name(../../..), '.', name(../..), '.', name(..), '.', name(.))" />

<xsl:key name="items" match="*[not(parent::result or self::item/parent::*[not(self::items)]/parent::result) and @href]" use="@href" />
<xsl:key name="terms" match="termBinding/item" use="label" />
<xsl:key name="propertyTerms" match="termBinding/item" use="property/@href" />

<xsl:variable name="namespaces" select="document('')/xsl:stylesheet/namespace::*" />
<xsl:variable name="wgs84_pos" select="$namespaces[name() = 'wgs84_pos']" />
<xsl:variable name="spatial" select="$namespaces[name() = 'spatial']" />
<xsl:variable name="rdfs" select="$namespaces[name() = 'rdfs']" />
<xsl:variable name="skos" select="$namespaces[name() = 'skos']" />
<xsl:variable name="foaf" select="$namespaces[name() = 'foaf']" />
<xsl:variable name="dc" select="$namespaces[name() = 'dc']" />

<xsl:param name="northing" select="key('propertyTerms', concat($spatial, 'northing'))/label" />
<xsl:param name="easting" select="key('propertyTerms', concat($spatial, 'easting'))/label" />

<xsl:param name="lat" select="key('propertyTerms', concat($wgs84_pos, 'lat'))/label" />
<xsl:param name="long" select="key('propertyTerms', concat($wgs84_pos, 'long'))/label" />

<xsl:param name="label" select="key('propertyTerms', concat($rdfs, 'label'))/label" />

<xsl:param name="prefLabel" select="key('propertyTerms', concat($skos, 'prefLabel'))/label" />
<xsl:param name="altLabel" select="key('propertyTerms', concat($skos, 'altLabel'))/label" />

<xsl:param name="name" select="key('propertyTerms', concat($foaf, 'name'))/label" />

<xsl:param name="title" select="key('propertyTerms', concat($dc, 'title'))/label" />

<!-- 
	ordering for efficiency based on occurrence as first letter of word:
	http://letterfrequency.org/#words-begin-with-letter-frequency
-->
<xsl:variable name="uppercase" select="'TAISOWHBCMFPDRLEGNYUKVJQXZ'" />
<xsl:variable name="lowercase" select="'taisowhbcmfpdrlegnyukvjqxz'" />
<xsl:variable name="numbers" select="'0123456789'" />

<xsl:template match="*" mode="label">
	<xsl:param name="label" select="local-name(.)" />
	<xsl:param name="addLink" select="false()" />
	<xsl:variable name="text">
		<xsl:choose>
			<xsl:when test="translate($label, $uppercase, '') = ''">
				<xsl:value-of select="$label" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="splitOnCapital">
					<xsl:with-param name="string" select="$label" />
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="binding" select="key('terms', $label)" />
	<xsl:choose>
		<xsl:when test="$addLink and $binding">
			<xsl:variable name="propertyUri" select="$binding/property/@href" />
			<a href="{$propertyUri}">
				<xsl:copy-of select="$text" />
			</a>
		</xsl:when>
		<xsl:otherwise>
			<xsl:copy-of select="$text" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template name="splitOnCapital">
	<xsl:param name="string" />
	<xsl:param name="token" select="''" />
	<xsl:choose>
		<xsl:when test="$string = ''">
			<xsl:value-of select="$token" />
		</xsl:when>
		<xsl:when test="contains($numbers, substring($string, 1, 1))">
			<xsl:value-of select="$token" />
			<xsl:if test="$token != ''">
				<xsl:text> </xsl:text>
			</xsl:if>
			<xsl:call-template name="skip">
				<xsl:with-param name="string" select="$string" />
				<xsl:with-param name="characters" select="$numbers" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="contains($uppercase, substring($string, 1, 1))">
			<xsl:value-of select="$token" />
			<xsl:if test="$token != ''">
				<xsl:text> </xsl:text>
			</xsl:if>
			<xsl:choose>
				<xsl:when test="contains($uppercase, substring($string, 2, 1))">
					<xsl:call-template name="skip">
						<xsl:with-param name="string" select="$string" />
						<xsl:with-param name="characters" select="$uppercase" />
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="splitOnCapital">
						<xsl:with-param name="string" select="substring($string, 2)" />
						<xsl:with-param name="token" select="translate(substring($string, 1, 1), $uppercase, $lowercase)" />
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="substring($string, 2)" />
				<xsl:with-param name="token" select="concat($token, substring($string, 1, 1))" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="skip">
	<xsl:param name="string" />
	<xsl:param name="characters" />
	<xsl:param name="token" select="''" />
	<xsl:choose>
		<xsl:when test="string-length($string) &lt;= 1">
			<xsl:value-of select="concat($token, $string)" />
		</xsl:when>
		<xsl:when test="contains($characters, substring($string, 1, 1))">
			<xsl:choose>
				<xsl:when test="$characters = $uppercase and contains($lowercase, substring($string, 2, 1))">
					<xsl:value-of select="$token" />
					<xsl:text> </xsl:text>
					<xsl:call-template name="splitOnCapital">
						<xsl:with-param name="string" select="$string" />
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="skip">
						<xsl:with-param name="string" select="substring($string, 2)" />
						<xsl:with-param name="characters" select="$characters" />
						<xsl:with-param name="token" select="concat($token, substring($string, 1, 1))" />
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$token" />
			<xsl:text> </xsl:text>
			<xsl:call-template name="splitOnCapital">
				<xsl:with-param name="string" select="$string" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="@href" mode="uri">
	<xsl:value-of select="." />
</xsl:template>

<xsl:template match="result" mode="searchURI">
	<xsl:choose>
		<xsl:when test="items">
			<xsl:value-of select="first/@href" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="uriExceptLastPart">
				<xsl:with-param name="uri" select="@href" />
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="uriExceptLastPart">
	<xsl:param name="uri" />
	<xsl:param name="newUri" select="''" />
	<xsl:choose>
		<xsl:when test="contains($uri, '/')">
			<xsl:call-template name="uriExceptLastPart">
				<xsl:with-param name="uri" select="substring-after($uri, '/')" />
				<xsl:with-param name="newUri">
					<xsl:choose>
						<xsl:when test="$newUri = ''">
							<xsl:value-of select="substring-before($uri, '/')" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="concat($newUri, '/', substring-before($uri, '/'))"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$newUri" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="paramValue">
	<xsl:param name="uri" />
	<xsl:param name="param" />
	<xsl:call-template name="unescapeValue">
		<xsl:with-param name="value">
			<xsl:choose>
				<xsl:when test="contains($uri, concat('&amp;', $param, '='))">
					<xsl:value-of select="substring-before(concat(substring-after($uri, concat('&amp;', $param, '=')), '&amp;'), '&amp;')" />
				</xsl:when>
				<xsl:when test="contains($uri, concat('?', $param, '='))">
					<xsl:value-of select="substring-before(concat(substring-after($uri, concat('?', $param, '=')), '&amp;'), '&amp;')" />
				</xsl:when>
			</xsl:choose>
		</xsl:with-param>
	</xsl:call-template>
</xsl:template>

<xsl:template name="substituteParam">
	<xsl:param name="uri" />
	<xsl:param name="param" />
	<xsl:param name="value" />
	<xsl:variable name="escapedValue">
		<xsl:call-template name="escapeValue">
			<xsl:with-param name="value" select="$value" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:variable name="paramNameValue" select="concat($param, '=', $escapedValue)" />
	<xsl:choose>
		<xsl:when test="$value != '' and 
			((contains($uri, $paramNameValue) and
			  (substring-after($uri, concat('&amp;', $paramNameValue)) = '' or
			   starts-with(substring-after($uri, concat('&amp;', $paramNameValue)), '&amp;'))) or
			 (contains($uri, concat('?', $param, '=', $value)) and
			  (substring-after($uri, concat('?', $paramNameValue)) = '' or
			   starts-with(substring-after($uri, concat('?', $paramNameValue)), '&amp;'))))">
			<xsl:value-of select="$uri" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:variable name="base">
				<xsl:choose>
					<xsl:when test="contains($uri, concat('&amp;', $param, '='))">
						<xsl:value-of select="substring-before($uri, concat('&amp;', $param, '='))" />
						<xsl:variable name="rest" select="substring-after($uri, concat('&amp;', $param, '='))" />
						<xsl:if test="contains($rest, '&amp;')">
							<xsl:text>&amp;</xsl:text>
							<xsl:value-of select="substring-after($rest, '&amp;')" />
						</xsl:if>
					</xsl:when>
					<xsl:when test="contains($uri, concat('?', $param, '='))">
						<xsl:value-of select="substring-before($uri, concat('?', $param, '='))" />
						<xsl:variable name="rest" select="substring-after($uri, concat('?', $param, '='))" />
						<xsl:if test="contains($rest, '&amp;')">
							<xsl:text>?</xsl:text>
							<xsl:value-of select="substring-after($rest, '&amp;')" />
						</xsl:if>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$uri" />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:choose>
				<xsl:when test="$value = ''">
					<xsl:value-of select="$base" />
				</xsl:when>
				<xsl:when test="contains($base, '?')">
					<xsl:value-of select="concat($base, '&amp;', $param, '=', $escapedValue)" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="concat($base, '?', $param, '=', $escapedValue)" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="lastURIpart">
	<xsl:param name="uri" />
	<xsl:choose>
		<xsl:when test="contains($uri, '#')">
			<xsl:value-of select="substring-after($uri, '#')" />
		</xsl:when>
		<xsl:when test="contains($uri, '/')">
			<xsl:choose>
				<xsl:when test="substring-after($uri, '/') = ''">
					<xsl:value-of select="substring-before($uri, '/')" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="lastURIpart">
						<xsl:with-param name="uri" select="substring-after($uri, '/')" />
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$uri" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="min">
	<xsl:param name="values" />
	<xsl:param name="min" select="$values[1]" />
	<xsl:choose>
		<xsl:when test="not($values)">
			<xsl:value-of select="$min" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="min">
				<xsl:with-param name="values" select="$values[position() > 1]" />
				<xsl:with-param name="min">
					<xsl:choose>
						<xsl:when test="$values[1] &lt; $min">
							<xsl:value-of select="$values[1]" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$min" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>
	
<xsl:template name="max">
	<xsl:param name="values" />
	<xsl:param name="max" select="$values[1]" />
	<xsl:choose>
		<xsl:when test="not($values)">
			<xsl:value-of select="$max" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="max">
				<xsl:with-param name="values" select="$values[position() > 1]" />
				<xsl:with-param name="max">
					<xsl:choose>
						<xsl:when test="$values[1] > $max">
							<xsl:value-of select="$values[1]" />
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$max" />
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="jsEscape">
	<xsl:param name="string" />
	<xsl:choose>
		<xsl:when test='contains($string, "&apos;")'>
			<xsl:value-of select='substring-before($string, "&apos;")' />
			<xsl:text>\'</xsl:text>
			<xsl:call-template name="jsEscape">
				<xsl:with-param name="string" select='substring-after($string, "&apos;")' />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$string" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="bestLabelParam">
	<xsl:choose>
		<xsl:when test="*[name(.) = $prefLabel]"><xsl:value-of select="$prefLabel" /></xsl:when>
		<xsl:when test="*[name(.) = $title]"><xsl:value-of select="$title" /></xsl:when>
		<xsl:when test="*[name(.) = $name]"><xsl:value-of select="$name" /></xsl:when>
		<xsl:when test="*[name(.) = $label]"><xsl:value-of select="$label" /></xsl:when>
		<xsl:when test="*[name(.) = $altLabel]"><xsl:value-of select="$altLabel" /></xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" name="isLabelParam" mode="isLabelParam">
	<xsl:param name="paramName" select="name(.)" />
	<xsl:choose>
		<xsl:when test="$paramName = $label or $paramName = $prefLabel or $paramName = $altLabel or $paramName = $name or $paramName = $title">true</xsl:when>
		<xsl:otherwise>false</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="hasLabelProperty">
	<xsl:param name="properties" select="*" />
	<xsl:variable name="first" select="$properties[1]" />
	<xsl:variable name="firstIsLabelProperty">
		<xsl:apply-templates select="$first" mode="isLabelParam" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="not($properties)">false</xsl:when>
		<xsl:when test="$firstIsLabelProperty = 'true'">true</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="hasLabelProperties">
				<xsl:with-param name="properties" select="$properties[position() > 1]" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="hasNonLabelProperties">
	<xsl:param name="properties" select="*" />
	<xsl:variable name="first" select="$properties[1]" />
	<xsl:variable name="firstIsLabelProperty">
		<xsl:apply-templates select="$first" mode="isLabelParam" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$properties[self::item] and not($properties[not(self::item)])">
			<xsl:apply-templates select="." mode="anyItemHasNonLabelProperties" />
		</xsl:when>
		<xsl:when test="not($properties)">false</xsl:when>
		<xsl:when test="$firstIsLabelProperty = 'false'">true</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="hasNonLabelProperties">
				<xsl:with-param name="properties" select="$properties[position() > 1]" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="hasNoLabelProperties">
	<xsl:param name="properties" select="*" />
	<xsl:param name="sample" select="10" />
	<xsl:variable name="first" select="$properties[1]" />
	<xsl:variable name="firstIsLabelProperty">
		<xsl:apply-templates select="$first" mode="isLabelParam" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="not($properties) or $sample = 0">true</xsl:when>
		<xsl:when test="$firstIsLabelProperty = 'true'">false</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="hasNoLabelProperties">
				<xsl:with-param name="properties" select="$properties[position() > 1]" />
				<xsl:with-param name="sample" select="$sample - 1" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="anyItemHasNonLabelProperties">
	<xsl:param name="items" select="item" />
	<xsl:param name="sample" select="10" />
	<xsl:variable name="first" select="$items[1]" />
	<xsl:variable name="firstHasNonLabelProperties">
		<xsl:apply-templates select="$first" mode="hasNonLabelProperties" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="not($items) or $sample = 0">false</xsl:when>
		<xsl:when test="$firstHasNonLabelProperties = 'true'">true</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="anyItemHasNonLabelProperties">
				<xsl:with-param name="items" select="$items[position() > 1]" />
				<xsl:with-param name="sample" select="$sample - 1" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="highestDescription">
	<xsl:param name="otherDescriptions" select="key('items', @href)[generate-id(.) != generate-id(current())]" />
	<xsl:param name="thisDepth" select="count(ancestor::*[not(self::item)])" />
	<xsl:choose>
		<xsl:when test="not($otherDescriptions)">
			<xsl:value-of select="generate-id(.)" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:variable name="firstDepth" select="count($otherDescriptions[1]/ancestor::*[not(self::item)])" />
			<xsl:choose>
				<xsl:when test="$firstDepth &lt; $thisDepth">
					<xsl:value-of select="generate-id($otherDescriptions[1])" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="." mode="highestDescription">
						<xsl:with-param name="otherDescriptions" select="$otherDescriptions[position() > 1]" />
						<xsl:with-param name="thisDepth" select="$thisDepth" />
					</xsl:apply-templates>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template match="*" mode="isHighestDescription">
	<xsl:variable name="highestDescription">
		<xsl:apply-templates select="." mode="highestDescription" />
	</xsl:variable>
	<xsl:value-of select="$highestDescription = generate-id(.)" />
</xsl:template>

<xsl:template match="*" mode="anyItemIsHighestDescription">
	<xsl:param name="items" select="item" />
	<xsl:variable name="first" select="$items[1]" />
	<xsl:variable name="firstIsHighestDescription">
		<xsl:apply-templates select="$first" mode="isHighestDescription" />
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="not($items)">false</xsl:when>
		<xsl:when test="$firstIsHighestDescription = 'true'">true</xsl:when>
		<xsl:otherwise>
			<xsl:apply-templates select="." mode="anyItemIsHighestDescription">
				<xsl:with-param name="items" select="$items[position() > 1]" />
			</xsl:apply-templates>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="numberDistinctValues">
	<xsl:param name="values" />
	<!-- this is a hack to work out how many distinct values there are by
		creating a string that contains a dot for each value that hasn't come
		earlier in the set, and then taking its length -->
	<xsl:variable name="dots">
		<xsl:for-each select="$values">
			<xsl:variable name="position" select="position()" />
			<xsl:if test="not(. = $values[position() &lt; $position])">.</xsl:if>
		</xsl:for-each>
	</xsl:variable>
	<xsl:value-of select="string-length($dots)" />
</xsl:template>

<xsl:template name="escapeValue">
	<xsl:param name="value" />
	<xsl:choose>
		<xsl:when test="contains($value, '+')">
			<xsl:value-of select="substring-before($value, '+')"/>
			<xsl:text>%2B</xsl:text>
			<xsl:call-template name="escapeValue">
				<xsl:with-param name="value" select="substring-after($value, '+')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$value" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="unescapeValue">
	<xsl:param name="value" />
	<xsl:choose>
		<xsl:when test="contains($value, '%20')">
			<xsl:call-template name="unescapeValue">
				<xsl:with-param name="value" select="substring-before($value, '%20')" />
			</xsl:call-template>
			<xsl:text> </xsl:text>
			<xsl:call-template name="unescapeValue">
				<xsl:with-param name="value" select="substring-after($value, '%20')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="contains($value, '%3A')">
			<xsl:call-template name="unescapeValue">
				<xsl:with-param name="value" select="substring-before($value, '%3A')" />
			</xsl:call-template>
			<xsl:text>:</xsl:text>
			<xsl:call-template name="unescapeValue">
				<xsl:with-param name="value" select="substring-after($value, '%3A')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:when test="contains($value, '%2B')">
			<xsl:value-of select="substring-before($value, '%2B')"/>
			<xsl:text>+</xsl:text>
			<xsl:call-template name="unescapeValue">
				<xsl:with-param name="value" select="substring-after($value, '%2B')" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="translate($value, '+', ' ')" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="subPath">
	<xsl:param name="uri" />
	<xsl:param name="component" />
	<xsl:variable name="componentPart" select="concat('/', $component, '/')" />
	<xsl:variable name="after" select="substring-after($uri, $componentPart)" />
	<xsl:value-of select="concat(substring-before($uri, $componentPart), $componentPart, substring-before(concat($after, '/'), '/'))" />
</xsl:template>

</xsl:stylesheet>