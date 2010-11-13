<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:import href="result.xsl" />

<xsl:variable name="startYear" select="2001" />
<xsl:variable name="endYear" select="2007" />

<xsl:key name="vehicleTypes" match="vehicleType" use="@href" />
<xsl:variable name="vehicleTypes" select="//vehicleType/@href" />
<xsl:variable name="allSameType" select="count($vehicleTypes) = count(key('vehicleTypes', $vehicleTypes[1]))" />

<xsl:template match="isPartOf" mode="moreinfo">
	<xsl:variable name="base" select="substring-after(@href, 'http://transport.data.gov.uk')" />
	<xsl:variable name="path" select="substring-before(concat($base, '?'), '?')" />
	<xsl:variable name="query">
		<xsl:if test="contains($base, '?')">
			<xsl:value-of select="substring-after($base, '?')" />
		</xsl:if>
	</xsl:variable>
	<xsl:variable name="sep">
		<xsl:choose>
			<xsl:when test="contains($base, '?')">&amp;</xsl:when>
			<xsl:otherwise>?</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="starts-with($path, '/doc/traffic-count-point')">
			<xsl:variable name="countPoint" select="concat('/doc/traffic-count-point/', substring-before(substring-after($path, '/traffic-count-point/'), '/'))" />
			<xsl:choose>
				<!-- Observations -->
				<xsl:when test="contains($path, '/observation') and substring-after($path, '/observation') = ''">
					<xsl:choose>
						<xsl:when test="contains($path, '/direction/')">
							<!-- Observations on a Count -->
						</xsl:when>
						<xsl:otherwise>
							<!-- Observations on a Count Point -->
							<xsl:variable name="hasDirection" select="contains($query, 'observationDirection=')" />
							<xsl:variable name="hasYear" select="contains($query, 'min-observationHour.beginning.asDateTime=') and contains($query, 'max-observationHour.beginning.asDateTime')" />
							<xsl:variable name="hasVehicleType" select="contains($query, 'vehicleType.name=')" />
							<ul>
								<xsl:choose>
									<xsl:when test="$hasDirection">
										<xsl:call-template name="directionLinks">
											<xsl:with-param name="uri" select="$base" />
											<xsl:with-param name="directionParam" select="'observationDirection'" />
										</xsl:call-template>
										<li>
											<a>
												<xsl:attribute name="href">
													<xsl:call-template name="substituteParam">
														<xsl:with-param name="uri" select="$base" />
														<xsl:with-param name="param" select="'observationDirection'" />
														<xsl:with-param name="value" select="''" />
													</xsl:call-template>
												</xsl:attribute>
												<xsl:text>Both directions</xsl:text>
											</a>
										</li>
									</xsl:when>
									<xsl:when test="/result/items/item[observationDirection/@href = 'http://dbpedia.org/resource/West' or observationDirection/@href = 'http://dbpedia.org/resource/East']">
										<li><a href="{$base}{$sep}observationDirection=west">West-bound</a></li>
										<li><a href="{$base}{$sep}observationDirection=east">East-bound</a></li>
									</xsl:when>
									<xsl:otherwise>
										<li><a href="{$base}{$sep}observationDirection=north">North-bound</a></li>
										<li><a href="{$base}{$sep}observationDirection=south">South-bound</a></li>
									</xsl:otherwise>
								</xsl:choose>
							</ul>
							<ul>
								<xsl:call-template name="yearLinks">
									<xsl:with-param name="uri" select="$base" />
									<xsl:with-param name="hourParam" select="'observationHour'" />
								</xsl:call-template>
								<xsl:if test="$hasYear">
									<li>
										<a>
											<xsl:attribute name="href">
												<xsl:call-template name="substituteParam">
													<xsl:with-param name="uri">
														<xsl:call-template name="substituteParam">
															<xsl:with-param name="uri" select="$base" />
															<xsl:with-param name="param" select="'max-observationHour.beginning.asDateTime'" />
															<xsl:with-param name="value" select="''" />
														</xsl:call-template>
													</xsl:with-param>
													<xsl:with-param name="param" select="'min-observationHour.beginning.asDateTime'" />
													<xsl:with-param name="value" select="''" />
												</xsl:call-template>
											</xsl:attribute>
											<xsl:text>All years</xsl:text>
										</a>
									</li>
								</xsl:if>
							</ul>
							<ul>
								<xsl:if test="$hasDirection or $hasYear or $hasVehicleType">
									<xsl:if test="($hasDirection and $hasYear) or $hasVehicleType">
										<xsl:call-template name="vehicleTypeLinks">
											<xsl:with-param name="uri" select="$base" />
										</xsl:call-template>
									</xsl:if>
									<xsl:if test="$hasVehicleType">
										<li>
											<a>
												<xsl:attribute name="href">
													<xsl:call-template name="substituteParam">
														<xsl:with-param name="uri" select="$base" />
														<xsl:with-param name="param" select="'vehicleType.name'" />
														<xsl:with-param name="value" select="''" />
													</xsl:call-template>
												</xsl:attribute>
												<xsl:text>All types of vehicles</xsl:text>
											</a>
										</li>
									</xsl:if>
								</xsl:if>
							</ul>
							<ul>
								<li><a href="{$countPoint}/observation">All observations at this count point</a></li>
							</ul>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<!-- Counts -->
				<xsl:when test="contains($path, '/count') and substring-after($path, '/count') = ''">
					<xsl:variable name="direction">
						<xsl:call-template name="paramValue">
							<xsl:with-param name="uri" select="$base" />
							<xsl:with-param name="param" select="'direction'" />
						</xsl:call-template>
					</xsl:variable>
					<xsl:variable name="hasDirection" select="$direction != ''" />
					<xsl:variable name="hasYear" select="contains($query, 'min-hour.beginning.asDateTime=') and contains($query, 'max-hour.beginning.asDateTime')" />
					<xsl:choose>
						<xsl:when test="$hasDirection">
							<ul>
								<xsl:call-template name="directionLinks">
									<xsl:with-param name="uri" select="$base" />
								</xsl:call-template>
							</ul>
						</xsl:when>
						<xsl:when test="/result/items/item/direction">
							<ul>
								<xsl:if test="/result/items/item[direction/@href = 'http://dbpedia.org/resource/West' or direction/@href = 'http://dbpedia.org/resource/East']">
									<li><a href="{$base}{$sep}direction=west">West-bound</a></li>
									<li><a href="{$base}{$sep}direction=east">East-bound</a></li>
								</xsl:if>
								<xsl:if test="/result/items/item[direction/@href = 'http://dbpedia.org/resource/North' or direction/@href = 'http://dbpedia.org/resource/South']">
									<li><a href="{$base}{$sep}direction=north">North-bound</a></li>
									<li><a href="{$base}{$sep}direction=south">South-bound</a></li>
								</xsl:if>
							</ul>
						</xsl:when>
					</xsl:choose>
					<ul>
						<xsl:call-template name="yearLinks">
							<xsl:with-param name="uri" select="$base" />
						</xsl:call-template>
					</ul>
					<xsl:if test="$hasDirection or $hasYear">
						<ul>
							<xsl:variable name="observationsUri">
								<xsl:value-of select="concat($countPoint, '/observation?')" />
								<xsl:if test="$hasDirection">
									<xsl:text>observationDirection=</xsl:text>
									<xsl:value-of select="substring-before(concat(substring-after($query, 'direction='), '&amp;'), '&amp;')" />
								</xsl:if>
								<xsl:if test="$hasYear">
									<xsl:if test="$hasDirection">&amp;</xsl:if>
									<xsl:text>min-observationHour.beginning.asDateTime=</xsl:text>
									<xsl:value-of select="substring-before(concat(substring-after($query, 'min-hour.beginning.asDateTime='), '&amp;'), '&amp;')" />
									<xsl:text>&amp;</xsl:text>
									<xsl:text>max-observationHour.beginning.asDateTime=</xsl:text>
									<xsl:value-of select="substring-before(concat(substring-after($query, 'max-hour.beginning.asDateTime='), '&amp;'), '&amp;')" />
									<xsl:text>&amp;_sort=observationHour.beginning.asDateTime</xsl:text>
								</xsl:if>
							</xsl:variable>
							<xsl:if test="$hasDirection and $hasYear">
								<xsl:call-template name="vehicleTypeLinks">
									<xsl:with-param name="uri" select="$observationsUri" />
								</xsl:call-template>
							</xsl:if>
							<li><a href="{$observationsUri}">All observations for these counts</a></li>
						</ul>
					</xsl:if>
					<ul>
						<li><a href="{$countPoint}/observation">All observations at this count point</a></li>
						<li><a href="{$countPoint}">Count point</a></li>
						<li><a href="/doc/traffic-count-point">All count points</a></li>
					</ul>
				</xsl:when>
			</xsl:choose>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="directionLinks">
	<xsl:param name="uri" />
	<xsl:param name="directionParam" select="'direction'" />
	<xsl:param name="currentDirection">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="$uri" />
			<xsl:with-param name="param" select="$directionParam" />
		</xsl:call-template>
	</xsl:param>
	<xsl:variable name="newDirectionLink">
		<xsl:call-template name="substituteParam">
			<xsl:with-param name="uri" select="$uri" />
			<xsl:with-param name="param" select="$directionParam" />
			<xsl:with-param name="value">
				<xsl:choose>
					<xsl:when test="$currentDirection = 'west'">east</xsl:when>
					<xsl:when test="$currentDirection = 'east'">west</xsl:when>
					<xsl:when test="$currentDirection = 'north'">south</xsl:when>
					<xsl:when test="$currentDirection = 'south'">north</xsl:when>
				</xsl:choose>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:variable>
	<xsl:choose>
		<xsl:when test="$currentDirection = 'north'">
			<li><span class="current">North-bound</span></li>
			<li><a href="{$newDirectionLink}">South-bound</a></li>
		</xsl:when>
		<xsl:when test="$currentDirection = 'south'">
			<li><a href="{$newDirectionLink}">North-bound</a></li>
			<li><span class="current">South-bound</span></li>
		</xsl:when>
		<xsl:when test="$currentDirection = 'east'">
			<li><span class="current">East-bound</span></li>
			<li><a href="{$newDirectionLink}">West-bound</a></li>
		</xsl:when>
		<xsl:when test="$currentDirection = 'west'">
			<li><a href="{$newDirectionLink}">East-bound</a></li>
			<li><span class="current">West-bound</span></li>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="yearLinks">
	<xsl:param name="uri" />
	<xsl:param name="hourParam" select="'hour'" />
	<xsl:param name="currentYear">
		<xsl:variable name="startDate">
			<xsl:call-template name="paramValue">
				<xsl:with-param name="uri" select="@href" />
				<xsl:with-param name="param" select="concat('min-', $hourParam, '.beginning.asDateTime')" />
			</xsl:call-template>
		</xsl:variable>
		<xsl:value-of select="substring-before($startDate, '-')" />
	</xsl:param>
	<xsl:param name="startYear" select="$startYear" />
	<xsl:param name="endYear" select="$endYear" />
	<xsl:if test="$endYear >= $startYear">
		<xsl:call-template name="yearLink">
			<xsl:with-param name="year" select="$endYear" />
			<xsl:with-param name="currentYear" select="$currentYear" />
			<xsl:with-param name="uri" select="$uri" />
			<xsl:with-param name="hourParam" select="$hourParam" />
		</xsl:call-template>
		<xsl:if test="$endYear != $startYear">
			<xsl:call-template name="yearLinks">
				<xsl:with-param name="startYear" select="$startYear" />
				<xsl:with-param name="endYear" select="$endYear - 1" />
				<xsl:with-param name="currentYear" select="$currentYear" />
				<xsl:with-param name="uri" select="$uri" />
				<xsl:with-param name="hourParam" select="$hourParam" />
			</xsl:call-template>
		</xsl:if>
	</xsl:if>
</xsl:template>

<xsl:template name="yearLink">
	<xsl:param name="year" />
	<xsl:param name="currentYear" />
	<xsl:param name="uri" />
	<xsl:param name="hourParam" />
	<xsl:variable name="start" select="concat('=', $currentYear, '-')" />
	<xsl:variable name="end" select="concat('=', $currentYear + 1, '-')" />
	<li>
		<xsl:choose>
			<xsl:when test="$year = $currentYear">
				<span class="current"><xsl:value-of select="$year"/></span>
			</xsl:when>
			<xsl:when test="$currentYear = ''">
				<xsl:variable name="sep">
					<xsl:choose>
						<xsl:when test="contains($uri, '?')">&amp;</xsl:when>
						<xsl:otherwise>?</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<a href="{$uri}{$sep}min-{$hourParam}.beginning.asDateTime={$year}-01-01T00:00:00Z&amp;max-{$hourParam}.beginning.asDateTime={$year+1}-01-01T00:00:00Z&amp;_sort={$hourParam}.beginning.asDateTime"><xsl:value-of select="$year"/></a>
			</xsl:when>
			<xsl:otherwise>
				<a href="{substring-before($uri, $start)}={$year}-{substring-before(substring-after($uri, $start), $end)}={$year+1}-{substring-after($uri, $end)}"><xsl:value-of select="$year"/></a>
			</xsl:otherwise>
		</xsl:choose>
	</li>
</xsl:template>

<xsl:template name="vehicleTypeLinks">
	<xsl:param name="uri" />
	<xsl:variable name="baseUri">
		<xsl:call-template name="substituteParam">
			<xsl:with-param name="uri" select="$uri" />
			<xsl:with-param name="param" select="'vehicleType.name'" />
			<xsl:with-param name="value" select="''" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:variable name="currentVehicleType">
		<xsl:call-template name="paramValue">
			<xsl:with-param name="uri" select="$uri" />
			<xsl:with-param name="param" select="'vehicleType.name'" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Bicycles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Motorbikes'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Cars and Taxis'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Buses and Coaches'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Rigid 2-axle Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Rigid 3-axle Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Rigid 4plus-axle Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Articulated 3 or 4-axle Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Articulated 5-axle Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Articulated 6plus-axle Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Heavy Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Light Goods Vehicles'" />
	</xsl:call-template>
	<xsl:call-template name="vehicleTypeLink">
		<xsl:with-param name="uri" select="$baseUri" />
		<xsl:with-param name="currentVehicleType" select="$currentVehicleType" />
		<xsl:with-param name="vehicleType" select="'Motor Vehicles'" />
	</xsl:call-template>
</xsl:template>

<xsl:template name="vehicleTypeLink">
	<xsl:param name="uri" />
	<xsl:param name="currentVehicleType" />
	<xsl:param name="vehicleType" />
	<xsl:variable name="vehicleTypeLabel" select="$vehicleType" />
	<xsl:variable name="sep">
		<xsl:choose>
			<xsl:when test="contains($uri, '?')">&amp;</xsl:when>
			<xsl:otherwise>?</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<li>
		<xsl:choose>
			<xsl:when test="$vehicleType = $currentVehicleType">
				<span class="current"><xsl:value-of select="$vehicleTypeLabel" /></span>
			</xsl:when>
			<xsl:otherwise>
				<a href="{$uri}{$sep}vehicleType.name={translate($vehicleType, ' ', '+')}"><xsl:value-of select="$vehicleTypeLabel" /></a>
			</xsl:otherwise>
		</xsl:choose>
	</li>
</xsl:template>

<xsl:template match="primaryTopic" mode="moreinfo">
	<xsl:choose>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/road/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/traffic-count-point">Points on the <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/road">All roads</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/traffic-count-point/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<xsl:variable name="rest" select="substring-after(@href, 'http://transport.data.gov.uk/id/traffic-count-point/')" />
			<xsl:choose>
				<xsl:when test="contains($rest, '/type/')">
					<!-- this is an observation -->
					<ul>
						<li><a href="{substring-before($base, '/type/')}">Count including this observation</a></li>
						<li><a href="/doc/traffic-count-point/{substring-before($rest, '/')}">Count point for this observation</a></li>
					</ul>
				</xsl:when>
				<xsl:when test="contains($rest, '/')">
					<!-- this is a traffic count -->
					<ul>
						<li><a href="{$base}/observation">Observations taken at this time</a></li>
						<li><a href="/doc/traffic-count-point/{substring-before($rest, '/')}">Count point for this count</a></li>
					</ul>
				</xsl:when>
				<xsl:otherwise>
					<!-- this is a traffic count point -->
					<ul>
						<li><a href="{$base}/count">Counts taken at this point</a></li>
						<li><a href="/doc/traffic-count-point">All traffic count points</a></li>
					</ul>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/country/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/nptg-locality">Localities in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="{$base}/nptg-district">Districts in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="{$base}/administrative-area">Administrative areas in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="{$base}/region">Regions in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/country">All countries</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/region/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/nptg-locality">Localities in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="{$base}/nptg-district">Districts in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="{$base}/administrative-area">Administrative areas in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/region">All regions</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/administrative-area/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/nptg-locality">Localities in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="{$base}/nptg-district">Districts in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/administrative-area">All administrative areas</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/nptg-district/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/nptg-locality">Localities in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/nptg-district">All districts</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/nptg-locality/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/bus-stop-point">Bus stop points</a></li>
				<li><a href="{$base}/coach-stop-point">Coach stop points</a></li>
				<li><a href="{$base}/coach-station-stop-point">Coach station stop points</a></li>
				<li><a href="{$base}/rail-stop-point">Rail stop points</a></li>
				<li><a href="{$base}/metro-stop-point">Metro stop points</a></li>
				<li><a href="{$base}/air-stop-point">Air stop points</a></li>
				<li><a href="{$base}/ferry-stop-point">Ferry stop points</a></li>
				<li><a href="{$base}/stop-point">All stop points</a></li>
			</ul>
			<ul>
				<xsl:if test="childNptgLocality">
					<li><a href="{$base}/children">Localities in <xsl:apply-templates select="." mode="name" /></a></li>
				</xsl:if>
				<li><a href="/doc/nptg-locality">All localities</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/stop-area/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/stop-point">Stop points in <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/stop-area">All stop areas</a></li>
			</ul>
		</xsl:when>
		<xsl:when test="starts-with(@href, 'http://transport.data.gov.uk/id/stop-point/')">
			<xsl:variable name="base" select="concat('/doc/', substring-after(@href, '/id/'))" />
			<ul>
				<li><a href="{$base}/stop-area">Stop areas containing <xsl:apply-templates select="." mode="name" /></a></li>
				<li><a href="/doc/stop-point">All stop points</a></li>
			</ul>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template match="value" mode="showBarchart">false</xsl:template>

<xsl:template match="value" mode="showBarchart">
	<xsl:param name="values" />
	<xsl:param name="distinctValues">
		<xsl:call-template name="numberDistinctValues">
			<xsl:with-param name="values" select="$values" />
		</xsl:call-template>
	</xsl:param>
	<xsl:param name="sort" />
	<xsl:value-of select="$distinctValues > 1 and $sort != '' and $allSameType" />
</xsl:template>

<xsl:template match="value" mode="showBoxplot">
	<xsl:param name="values" />
	<xsl:variable name="distinctValues">
		<xsl:call-template name="numberDistinctValues">
			<xsl:with-param name="values" select="$values" />
		</xsl:call-template>
	</xsl:variable>
	<xsl:value-of select="$distinctValues != 1 and count($values) > 5 and not($values/item) and $allSameType" />
</xsl:template>

<xsl:template match="result[not(items)]" mode="searchURI">
	<xsl:choose>
		<xsl:when test="contains(@href, '/type/')">
			<xsl:value-of select="concat('/doc/traffic-count-point/', substring-before(substring-after(@href, '/traffic-count-point/'), '/'), '/observation')" />
		</xsl:when>
		<xsl:when test="contains(@href, '/hour/')">
			<xsl:value-of select="concat('/doc/traffic-count-point/', substring-before(substring-after(@href, '/traffic-count-point/'), '/'), '/count')" />
		</xsl:when>
		<xsl:otherwise>
			<xsl:apply-imports />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>