use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SnmpPortSample {
    pub name: String,
    pub speed: String,
    pub state: String,
    pub oid: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SnmpRefreshRequest {
    pub target: String,
    pub oid: Option<String>,
}

#[cfg_attr(not(test), allow(dead_code))]
pub fn parse_port_speed(raw: &str) -> String {
    let normalized = raw.trim().to_lowercase();
    if normalized.contains("10000000000") || normalized == "10g" {
        "10g".to_string()
    } else if normalized.contains("1000000000") || normalized == "gigabit" || normalized == "1g" {
        "gigabit".to_string()
    } else {
        "custom".to_string()
    }
}

pub async fn refresh_ports(request: SnmpRefreshRequest) -> Result<Vec<SnmpPortSample>, String> {
    if request.target.trim().is_empty() {
        return Err("SNMP target is required".to_string());
    }
    // Minimal PR scope: the command boundary and parser are real; transport can
    // be expanded behind this function without changing Rack Device metadata callers.
    Ok(Vec::new())
}

#[cfg(test)]
mod tests {
    use super::parse_port_speed;

    #[test]
    fn parses_common_port_speeds() {
        assert_eq!(parse_port_speed("1000000000"), "gigabit");
        assert_eq!(parse_port_speed("10000000000"), "10g");
        assert_eq!(parse_port_speed("25000000000"), "custom");
    }
}
